/**
 * Orígenes del WebView de Capacitor en Android (https://localhost con
 * androidScheme https) e iOS (capacitor://localhost). Solo ellos pueden llamar
 * a la API desde la app empaquetada; la web normal es de mismo origen.
 */
export const MOBILE_APP_ORIGINS: readonly string[] = ["https://localhost", "capacitor://localhost"];

const ALLOWED_METHODS = "GET, POST, OPTIONS";
const ALLOWED_HEADERS = "Authorization, Content-Type";
const PREFLIGHT_MAX_AGE_SECONDS = "600";

export function isMobileAppOrigin(origin: string | null): origin is string {
  return origin !== null && MOBILE_APP_ORIGINS.includes(origin);
}

/** Cabeceras CORS para un origen permitido; null si no lo es (no se añade nada). */
export function corsHeadersFor(origin: string | null, preflight: boolean): Record<string, string> | null {
  if (!isMobileAppOrigin(origin)) return null;
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
  };
  if (preflight) {
    headers["Access-Control-Allow-Methods"] = ALLOWED_METHODS;
    headers["Access-Control-Allow-Headers"] = ALLOWED_HEADERS;
    headers["Access-Control-Max-Age"] = PREFLIGHT_MAX_AGE_SECONDS;
  }
  return headers;
}
