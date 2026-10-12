/**
 * Cabeceras de seguridad de todas las respuestas (MASVS-NETWORK/PLATFORM).
 * La CSP es mínima a propósito: bloquea iframes, <object> y formularios hacia
 * otros orígenes sin tocar los scripts de Next, Turnstile ni Supabase.
 */
const ONE_YEAR_SECONDS = 31_536_000;

export const SECURITY_HEADERS: readonly { key: string; value: string }[] = [
  { key: "Strict-Transport-Security", value: `max-age=${ONE_YEAR_SECONDS}; includeSubDomains` },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
];
