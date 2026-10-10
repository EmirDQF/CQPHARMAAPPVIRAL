import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createContext, runInContext } from "node:vm";
import { describe, expect, it } from "vitest";

/**
 * Carga public/sw.js en un vm de Node con self/caches/fetch simulados y
 * verifica que nunca se cacheen API, RSC, errores ni redirecciones.
 */

const ORIGIN = "https://artikare.test";
const SW_SOURCE = readFileSync(join(process.cwd(), "public", "sw.js"), "utf8");

type Listener = (event: unknown) => void;
type FetchHandler = (input: unknown, init?: unknown) => Promise<Response>;

interface FakeRequest {
  url: string;
  method: string;
  mode: string;
  headers: Headers;
}

interface RequestOptions {
  method?: string;
  mode?: string;
  headers?: Record<string, string>;
}

function toKey(input: unknown): string {
  const raw = typeof input === "string" ? input : (input as { url: string }).url;
  return new URL(raw, ORIGIN).href;
}

function createFakeCaches(initial: Record<string, Map<string, Response>> = {}) {
  const stores = new Map<string, Map<string, Response>>(Object.entries(initial));
  const puts: string[] = [];
  const deleted: string[] = [];
  const caches = {
    open: async (name: string) => {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name)!;
      return {
        put: async (key: unknown, response: Response) => {
          puts.push(toKey(key));
          store.set(toKey(key), response);
        },
        match: async (key: unknown) => store.get(toKey(key)),
      };
    },
    match: async (key: unknown) => {
      for (const store of stores.values()) {
        const hit = store.get(toKey(key));
        if (hit) return hit;
      }
      return undefined;
    },
    keys: async () => [...stores.keys()],
    delete: async (name: string) => {
      deleted.push(name);
      return stores.delete(name);
    },
  };
  return { caches, stores, puts, deleted };
}

function loadServiceWorker(fetchHandler: FetchHandler, initialCaches = {}) {
  const listeners = new Map<string, Listener>();
  const fake = createFakeCaches(initialCaches);
  const sandbox: Record<string, unknown> = {
    caches: fake.caches,
    fetch: fetchHandler,
    Response,
    Headers,
    URL,
    Promise,
    Set,
    Object,
    location: { origin: ORIGIN },
    clients: { claim: async () => undefined },
    skipWaiting: async () => undefined,
    addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
  };
  sandbox.self = sandbox;
  const context = createContext(sandbox);
  runInContext(SW_SOURCE, context);
  return { context: sandbox, listeners, ...fake };
}

function makeRequest(path: string, options: RequestOptions = {}): FakeRequest {
  return {
    url: new URL(path, ORIGIN).href,
    method: options.method ?? "GET",
    mode: options.mode ?? "cors",
    headers: new Headers(options.headers ?? {}),
  };
}

async function dispatchFetch(sw: ReturnType<typeof loadServiceWorker>, request: FakeRequest) {
  const pending: Promise<unknown>[] = [];
  let responded: Promise<Response> | undefined;
  sw.listeners.get("fetch")!({
    request,
    respondWith: (promise: Promise<Response>) => {
      responded = promise;
    },
    waitUntil: (promise: Promise<unknown>) => pending.push(promise),
  });
  const response = responded ? await responded : undefined;
  await Promise.all(pending);
  return { response, responded: responded !== undefined };
}

function okResponse(body = "ok", headers: Record<string, string> = {}): Response {
  return new Response(body, { status: 200, headers });
}

function redirectedResponse(): Response {
  const response = okResponse("login");
  Object.defineProperty(response, "redirected", { value: true });
  return response;
}

function getStrategy(sw: ReturnType<typeof loadServiceWorker>, request: FakeRequest): string {
  const fn = sw.context.getStrategy as (r: FakeRequest, origin: string) => string;
  return fn(request, ORIGIN);
}

describe("service worker: decisión de estrategia", () => {
  const sw = loadServiceWorker(async () => okResponse());

  it("usa red sin caché para /api, RSC y prefetch de Next", () => {
    expect(getStrategy(sw, makeRequest("/api/leads"))).toBe("network-only");
    expect(getStrategy(sw, makeRequest("/app", { headers: { RSC: "1" } }))).toBe("network-only");
    expect(getStrategy(sw, makeRequest("/app?_rsc=abc123"))).toBe("network-only");
    expect(getStrategy(sw, makeRequest("/", { headers: { "Next-Router-Prefetch": "1" } }))).toBe(
      "network-only"
    );
  });

  it("cachea solo estáticos, fuentes e imágenes", () => {
    expect(getStrategy(sw, makeRequest("/_next/static/chunks/main-abc.js"))).toBe("cache-first");
    expect(getStrategy(sw, makeRequest("/fonts/geist.woff2"))).toBe("cache-first");
    expect(getStrategy(sw, makeRequest("/icons/icon-192x192.png"))).toBe("stale-while-revalidate");
    expect(getStrategy(sw, makeRequest("/manifest.json"))).toBe("network-only");
  });

  it("distingue la navegación a /app (incluido ?source=pwa) del resto", () => {
    expect(getStrategy(sw, makeRequest("/app?source=pwa", { mode: "navigate" }))).toBe(
      "app-navigation"
    );
    expect(getStrategy(sw, makeRequest("/blog", { mode: "navigate" }))).toBe("navigation");
  });

  it("ignora otros orígenes y métodos distintos de GET", () => {
    expect(getStrategy(sw, makeRequest("https://cdn.example.com/a.js"))).toBe("bypass");
    expect(getStrategy(sw, makeRequest("/api/leads", { method: "POST" }))).toBe("bypass");
  });
});

describe("service worker: fetch", () => {
  it("nunca responde ni cachea /api", async () => {
    const sw = loadServiceWorker(async () => okResponse());
    const result = await dispatchFetch(sw, makeRequest("/api/checkin"));
    expect(result.responded).toBe(false);
    expect(sw.puts).toEqual([]);
  });

  it("no cachea peticiones RSC", async () => {
    const sw = loadServiceWorker(async () => okResponse());
    const result = await dispatchFetch(sw, makeRequest("/app", { headers: { RSC: "1" } }));
    expect(result.responded).toBe(false);
    expect(sw.puts).toEqual([]);
  });

  it("cachea un estático de /_next/static y luego lo sirve desde caché", async () => {
    let calls = 0;
    const sw = loadServiceWorker(async () => {
      calls += 1;
      return okResponse("js", { "Cache-Control": "public, max-age=31536000, immutable" });
    });
    const request = makeRequest("/_next/static/chunks/main-abc.js");
    await dispatchFetch(sw, request);
    expect(sw.puts).toEqual([request.url]);

    const second = await dispatchFetch(sw, request);
    expect(await second.response!.text()).toBe("js");
    expect(calls).toBe(1);
  });

  it("no cachea un 500 ni una redirección", async () => {
    const serverError = loadServiceWorker(async () => new Response("error", { status: 500 }));
    const errorResult = await dispatchFetch(serverError, makeRequest("/_next/static/a.js"));
    expect(errorResult.response!.status).toBe(500);
    expect(serverError.puts).toEqual([]);

    const redirect = loadServiceWorker(async () => redirectedResponse());
    await dispatchFetch(redirect, makeRequest("/blog", { mode: "navigate" }));
    expect(redirect.puts).toEqual([]);
  });

  it("no cachea respuestas no-store", async () => {
    const sw = loadServiceWorker(async () => okResponse("html", { "Cache-Control": "no-store" }));
    await dispatchFetch(sw, makeRequest("/citas", { mode: "navigate" }));
    expect(sw.puts).toEqual([]);
  });

  it("sin red, /app?source=pwa cae a la pantalla /app cacheada", async () => {
    const shell = new Map([[`${ORIGIN}/app`, okResponse("app-shell")]]);
    const sw = loadServiceWorker(
      async () => {
        throw new TypeError("offline");
      },
      { "artikare-shell-v2": shell }
    );
    const result = await dispatchFetch(sw, makeRequest("/app?source=pwa", { mode: "navigate" }));
    expect(await result.response!.text()).toBe("app-shell");
  });

  it("sin red ni caché, muestra la pantalla sin conexión integrada", async () => {
    const sw = loadServiceWorker(async () => {
      throw new TypeError("offline");
    });
    const result = await dispatchFetch(sw, makeRequest("/app", { mode: "navigate" }));
    expect(result.response!.status).toBe(503);
    expect(await result.response!.text()).toContain("Sin conexión");
  });

  it("con red, la navegación a /app?source=pwa guarda la pantalla bajo /app", async () => {
    const sw = loadServiceWorker(async () => okResponse("fresh-app"));
    const result = await dispatchFetch(sw, makeRequest("/app?source=pwa", { mode: "navigate" }));
    expect(await result.response!.text()).toBe("fresh-app");
    expect(sw.puts).toEqual([`${ORIGIN}/app`]);
  });
});

describe("service worker: ciclo de vida", () => {
  it("activate borra v1 y cualquier caché ajena, y conserva v2", async () => {
    const sw = loadServiceWorker(async () => okResponse(), {
      "artikare-shell-v1": new Map(),
      "otra-cache": new Map(),
      "artikare-shell-v2": new Map(),
    });
    const pending: Promise<unknown>[] = [];
    sw.listeners.get("activate")!({ waitUntil: (p: Promise<unknown>) => pending.push(p) });
    await Promise.all(pending);
    expect(sw.deleted.sort()).toEqual(["artikare-shell-v1", "otra-cache"]);
    expect([...sw.stores.keys()]).toEqual(["artikare-shell-v2"]);
  });

  it("install precachea /app en v2 sin guardar redirecciones", async () => {
    const sw = loadServiceWorker(async (input) =>
      String(input) === "/app" ? okResponse("app-shell") : redirectedResponse()
    );
    const pending: Promise<unknown>[] = [];
    sw.listeners.get("install")!({ waitUntil: (p: Promise<unknown>) => pending.push(p) });
    await Promise.all(pending);
    expect(sw.puts).toEqual([`${ORIGIN}/app`]);
    expect([...sw.stores.keys()]).toEqual(["artikare-shell-v2"]);
  });
});
