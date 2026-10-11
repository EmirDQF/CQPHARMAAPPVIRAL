import { z } from "zod";

/**
 * Enlaces que abren la app nativa (Android App Links, `artikare://` y
 * `appUrlOpen`). Solo se aceptan rutas públicas compartibles —del propio
 * dominio por https, o `artikare://test`, `artikare://blog/<slug>`— y, de la
 * query, solo los UTM conocidos con valores simples: nada de PII ni de
 * parámetros libres. Las mismas rutas declara AndroidManifest.xml.
 *
 * El esquema propio no se puede verificar (cualquier app puede invocarlo), por
 * eso abre exactamente lo mismo que un enlace público y nada más.
 */
export const SHAREABLE_PATH_PREFIXES = ["/test", "/blog"] as const;

export const APP_URL_SCHEME = "artikare";

const ALLOWED_QUERY_KEYS = ["utm_source", "utm_medium", "utm_campaign"] as const;
const QUERY_VALUE_PATTERN = /^[a-z0-9-]{1,40}$/;

const httpsUrlSchema = z.string().transform((raw, context) => {
  try {
    const url = new URL(raw);
    if (url.protocol === "https:" && !url.username && !url.password) return url;
  } catch {
    // URL mal formada: cae al issue de abajo.
  }
  context.addIssue({ code: "custom", message: "URL https inválida" });
  return z.NEVER;
});

function isShareablePath(pathname: string): boolean {
  return SHAREABLE_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function keepAllowedQuery(searchParams: URLSearchParams): string {
  const kept = ALLOWED_QUERY_KEYS.flatMap((key): string[][] => {
    const value = searchParams.get(key);
    return value && QUERY_VALUE_PATTERN.test(value) ? [[key, value]] : [];
  });
  return kept.length > 0 ? `?${new URLSearchParams(kept).toString()}` : "";
}

const linkUrlSchema = z.string().transform((raw, context) => {
  try {
    const url = new URL(raw);
    const isAllowedScheme = url.protocol === "https:" || url.protocol === `${APP_URL_SCHEME}:`;
    if (isAllowedScheme && !url.username && !url.password) return url;
  } catch {
    // URL mal formada: cae al issue de abajo.
  }
  context.addIssue({ code: "custom", message: "Enlace inválido" });
  return z.NEVER;
});

/** `artikare://blog/slug` → `/blog/slug`: el primer segmento viaja como host. */
function pathOf(url: URL, siteHost: string): string | null {
  if (url.protocol === "https:") return url.host === siteHost ? url.pathname : null;
  if (!url.hostname || url.port) return null;
  return `/${url.hostname}${url.pathname}`;
}

/** Ruta interna a la que navegar, o null si el enlace no es nuestro o no es compartible. */
export function resolveDeepLink(rawUrl: unknown, siteUrl: string): string | null {
  const parsed = linkUrlSchema.safeParse(rawUrl);
  const site = httpsUrlSchema.safeParse(siteUrl);
  if (!parsed.success || !site.success) return null;

  const path = pathOf(parsed.data, site.data.host);
  if (path === null || !isShareablePath(path)) return null;
  return `${path}${keepAllowedQuery(parsed.data.searchParams)}`;
}
