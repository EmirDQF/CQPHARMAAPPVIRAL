import type { NextConfig } from "next";
import packageJson from "./package.json";
import { SECURITY_HEADERS } from "./src/lib/securityHeaders";
import { versionCodeFor } from "./src/lib/version/appVersion";

/**
 * BUILD_TARGET=mobile (scripts/build-mobile-web.mjs): export estático para
 * empaquetar la interfaz dentro del APK. No admite headers() ni rutas de
 * servidor (el script aparta api/, proxy y los .well-known durante el build);
 * trailingSlash para que Capacitor sirva /app/ajustes/index.html.
 */
const isMobileBuild = process.env.BUILD_TARGET === "mobile";

const nextConfig: NextConfig = {
  ...(isMobileBuild ? { output: "export" as const, distDir: "out-mobile", trailingSlash: true, images: { unoptimized: true } } : {}),
  // Versión visible en Ajustes → Acerca de, horneada en el build (sin red).
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
    NEXT_PUBLIC_APP_BUILD: String(versionCodeFor(packageJson.version)),
  },
  experimental: {
    // El LCP de la landing es el h1 (texto) y lo frenaba la hoja CSS bloqueante
    // en 4G lento; incrustada (~7 KB gzip) el primer paint no espera otro viaje.
    inlineCss: true,
  },
  ...(isMobileBuild ? {} : { async headers() {
    return [
      { source: "/:path*", headers: [...SECURITY_HEADERS] },
      {
        // El service worker nunca se sirve desde caché HTTP: cada despliegue
        // con una política nueva (CACHE_NAME) debe llegar a los clientes.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  } }),
};

export default nextConfig;
