/**
 * Base del servidor de la API. En la web queda vacía (rutas relativas, mismo
 * origen). En la app Android la interfaz va empaquetada en el APK y las
 * llamadas (respaldo, ARCO, citas) van a este https. Sin barra final.
 */
export function normalizeApiBase(raw: string | undefined): string {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return "";
  if (!URL.canParse(trimmed)) throw new Error("NEXT_PUBLIC_API_BASE_URL no es una URL válida");
  const url = new URL(trimmed);
  if (url.protocol !== "https:") throw new Error("NEXT_PUBLIC_API_BASE_URL debe ser https");
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

/** Une la base con una ruta de la API ("/api/sync"). Sin base devuelve la ruta tal cual. */
export function resolveApiUrl(path: string, base: string): string {
  if (!path.startsWith("/")) throw new Error("La ruta de la API debe empezar con /");
  return base ? `${base}${path}` : path;
}

export const API_BASE_URL = normalizeApiBase(process.env.NEXT_PUBLIC_API_BASE_URL);

/** true en la app empaquetada: la sesión viaja como Bearer, no como cookie de otro origen. */
export const IS_REMOTE_API = API_BASE_URL !== "";
