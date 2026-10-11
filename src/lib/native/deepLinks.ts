import { z } from "zod";

/**
 * Enlaces que abren la app nativa (Android App Links y `appUrlOpen`). Solo se
 * aceptan rutas públicas compartibles del propio dominio y, de la query, solo
 * los UTM conocidos con valores simples: nada de PII ni de parámetros libres.
 * Las mismas rutas declara el intent-filter de AndroidManifest.xml.
 */
export const SHAREABLE_PATH_PREFIXES = ["/test", "/blog"] as const;

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

/** Ruta interna a la que navegar, o null si el enlace no es nuestro o no es compartible. */
export function resolveDeepLink(rawUrl: unknown, siteUrl: string): string | null {
  const parsed = httpsUrlSchema.safeParse(rawUrl);
  const site = httpsUrlSchema.safeParse(siteUrl);
  if (!parsed.success || !site.success) return null;

  const url = parsed.data;
  if (url.host !== site.data.host || !isShareablePath(url.pathname)) return null;
  return `${url.pathname}${keepAllowedQuery(url.searchParams)}`;
}
