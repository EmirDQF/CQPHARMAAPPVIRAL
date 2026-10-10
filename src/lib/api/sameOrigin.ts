/**
 * Defensa CSRF para acciones destructivas con cookies de sesión: no se confía
 * solo en el SameSite que fije la librería. Pasa si el navegador declara la
 * petición como del mismo sitio (Sec-Fetch-Site) o si Origin coincide con el
 * host que la recibe. Sin ninguna de las dos señales, se rechaza.
 */
export function isSameOriginRequest(headers: Pick<Headers, "get">): boolean {
  const fetchSite = headers.get("sec-fetch-site");
  if (fetchSite) return fetchSite === "same-origin";

  const origin = headers.get("origin");
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
