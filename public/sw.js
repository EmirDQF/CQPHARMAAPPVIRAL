// Service worker de Artikare.
//
// Política de caché (los datos de salud viven en localStorage, nunca aquí):
// - NetworkOnly: /api/*, peticiones RSC/prefetch de Next y todo lo que no sea
//   GET del mismo origen (el navegador las resuelve sin pasar por el SW).
// - CacheFirst: /_next/static/* y fuentes (nombres con hash, inmutables).
// - StaleWhileRevalidate: imágenes e iconos.
// - Navegación a /app (incluido /app?source=pwa): red primero, con respaldo a
//   la pantalla /app cacheada y, si no existe, a una pantalla sin conexión.
// - Otras navegaciones: red primero con respaldo a caché si existe.
// - Nunca se cachean errores, respuestas opaque, redirecciones ni no-store.
//
// Las funciones son declaraciones de nivel superior para que la prueba
// (src/lib/serviceWorker.test.ts) pueda evaluarlas en un vm de Node.

const CACHE_NAME = "artikare-shell-v2";
const APP_PATH = "/app";
const PRECACHE_URLS = [APP_PATH, "/icons/icon-192x192.png", "/icons/icon-512x512.png"];

const STRATEGY = Object.freeze({
  BYPASS: "bypass",
  NETWORK_ONLY: "network-only",
  CACHE_FIRST: "cache-first",
  STALE_WHILE_REVALIDATE: "stale-while-revalidate",
  APP_NAVIGATION: "app-navigation",
  NAVIGATION: "navigation",
});

const FONT_EXTENSION = /\.(?:woff2?|ttf|otf|eot)$/i;
const IMAGE_EXTENSION = /\.(?:png|jpe?g|gif|webp|avif|svg|ico)$/i;
const CACHEABLE_RESPONSE_TYPES = new Set(["basic", "default"]);

const OFFLINE_HTML = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sin conexión | Artikare</title>
<style>body{font-family:system-ui,sans-serif;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#FBF8F3;color:#1F2A37;padding:16px;text-align:center}button{margin-top:16px;padding:12px 20px;border:2px solid #3F8A7E;border-radius:16px;background:#C9E8E4;color:#0F3D2E;font-size:18px;font-weight:700;min-height:56px}</style>
</head><body><main>
<h1>Sin conexión</h1>
<p>No pudimos conectarnos. Tus registros siguen guardados en este dispositivo.</p>
<button type="button" onclick="location.reload()">Reintentar</button>
</main></body></html>`;

/** Peticiones de datos RSC de Next (navegación cliente y prefetch): nunca se cachean. */
function isRscRequest(request, url) {
  const headers = request.headers;
  return (
    headers.get("RSC") !== null ||
    headers.get("Next-Router-Prefetch") !== null ||
    headers.get("Next-Router-State-Tree") !== null ||
    url.searchParams.has("_rsc")
  );
}

/** Decide la estrategia para una petición. Función pura: no toca red ni caché. */
function getStrategy(request, origin) {
  if (request.method !== "GET") return STRATEGY.BYPASS;
  const url = new URL(request.url);
  if (url.origin !== origin) return STRATEGY.BYPASS;
  if (url.pathname.startsWith("/api/")) return STRATEGY.NETWORK_ONLY;
  if (isRscRequest(request, url)) return STRATEGY.NETWORK_ONLY;

  if (request.mode === "navigate") {
    const isAppRoot = url.pathname === APP_PATH || url.pathname === `${APP_PATH}/`;
    return isAppRoot ? STRATEGY.APP_NAVIGATION : STRATEGY.NAVIGATION;
  }

  if (url.pathname.startsWith("/_next/static/")) return STRATEGY.CACHE_FIRST;
  if (FONT_EXTENSION.test(url.pathname)) return STRATEGY.CACHE_FIRST;
  if (url.pathname.startsWith("/icons/") || IMAGE_EXTENSION.test(url.pathname)) {
    return STRATEGY.STALE_WHILE_REVALIDATE;
  }
  return STRATEGY.NETWORK_ONLY;
}

/** Solo respuestas 2xx, sin redirección, del mismo origen y sin no-store. */
function isCacheableResponse(response) {
  if (!response || !response.ok) return false;
  if (response.redirected || !CACHEABLE_RESPONSE_TYPES.has(response.type)) return false;
  const cacheControl = response.headers.get("Cache-Control") || "";
  return !/no-store/i.test(cacheControl);
}

/** Clave de caché de navegación sin query (?source=pwa, utm…), para no duplicar páginas. */
function navigationCacheKey(url) {
  const parsed = new URL(url);
  return `${parsed.origin}${parsed.pathname.replace(/\/$/, "") || "/"}`;
}

function offlineResponse() {
  return new Response(OFFLINE_HTML, {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

async function putIfCacheable(key, response) {
  if (!isCacheableResponse(response)) return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(key, response);
}

/** Descarga y guarda una respuesta; devuelve la respuesta original para el cliente. */
function fetchAndCache(request, key, event) {
  return fetch(request).then((response) => {
    if (isCacheableResponse(response)) {
      event.waitUntil(putIfCacheable(key, response.clone()));
    }
    return response;
  });
}

async function cacheFirst(event) {
  const cached = await caches.match(event.request);
  return cached || fetchAndCache(event.request, event.request, event);
}

async function staleWhileRevalidate(event) {
  const cached = await caches.match(event.request);
  const network = fetchAndCache(event.request, event.request, event);
  if (!cached) return network;
  // La revalidación sigue en segundo plano; si falla, ya se sirvió la copia.
  event.waitUntil(network.then(() => undefined, () => undefined));
  return cached;
}

async function networkFirst(event, fallbackKeys) {
  const key = navigationCacheKey(event.request.url);
  try {
    return await fetchAndCache(event.request, key, event);
  } catch {
    for (const fallbackKey of [key, ...fallbackKeys]) {
      const cached = await caches.match(fallbackKey);
      if (cached) return cached;
    }
    return offlineResponse();
  }
}

async function precache() {
  const cache = await caches.open(CACHE_NAME);
  // Un recurso que falle no bloquea la instalación: sin él, la navegación usa
  // la pantalla sin conexión integrada.
  await Promise.allSettled(
    PRECACHE_URLS.map(async (path) => {
      const response = await fetch(path, { cache: "no-cache" });
      if (isCacheableResponse(response)) await cache.put(path, response);
    })
  );
}

async function deleteStaleCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(deleteStaleCaches().then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const strategy = getStrategy(event.request, self.location.origin);
  switch (strategy) {
    case STRATEGY.CACHE_FIRST:
      event.respondWith(cacheFirst(event));
      return;
    case STRATEGY.STALE_WHILE_REVALIDATE:
      event.respondWith(staleWhileRevalidate(event));
      return;
    case STRATEGY.APP_NAVIGATION:
      event.respondWith(networkFirst(event, [APP_PATH]));
      return;
    case STRATEGY.NAVIGATION:
      event.respondWith(networkFirst(event, []));
      return;
    default:
      // BYPASS y NETWORK_ONLY: sin respondWith, el navegador va directo a la red.
      return;
  }
});
