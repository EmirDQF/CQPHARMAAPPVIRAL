import { z } from "zod";

const PublicSupabaseEnvSchema = z.object({
  url: z.url(),
  anonKey: z.string().min(20),
});

export type PublicSupabaseEnv = z.infer<typeof PublicSupabaseEnvSchema>;

let hasWarnedGuestOnly = false;

/**
 * Variables públicas de Supabase. Sin ellas (o inválidas) la app sigue en modo
 * invitado: solo se registra un aviso, sin romper nada. Los accesos a
 * process.env.NEXT_PUBLIC_* van literales para que Next los incruste en el cliente.
 */
export function readPublicSupabaseEnv(): PublicSupabaseEnv | null {
  const parsed = PublicSupabaseEnvSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (parsed.success) return parsed.data;

  if (!hasWarnedGuestOnly) {
    hasWarnedGuestOnly = true;
    console.warn("[env] Supabase no configurado: la app funciona solo en modo invitado");
  }
  return null;
}

/**
 * En producción con Supabase activo el captcha es obligatorio: si falta la site key
 * el acceso se cierra (fail-closed) en vez de enviar códigos sin captcha.
 */
export function isCaptchaRequired(): boolean {
  return process.env.NODE_ENV === "production" && readPublicSupabaseEnv() !== null;
}

/** Clave pública de Cloudflare Turnstile; sin ella no se pide captcha (desarrollo local). */
export function readTurnstileSiteKey(): string | null {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  return siteKey && siteKey.length > 0 ? siteKey : null;
}
