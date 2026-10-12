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

/** E.164 de un celular peruano sin "+": 51 + 9 dígitos que empiezan en 9. */
const PERU_MOBILE_E164 = /^519\d{8}$/;

const WhatsAppNumberSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/^\+/, "").replace(/[\s-]/g, ""))
  .pipe(z.string().regex(PERU_MOBILE_E164));

let hasWarnedInvalidWhatsApp = false;

/** WhatsApp oficial del consultorio Artikare (+51 945 553 676), indicado por el negocio. Es público. */
export const CLINIC_WHATSAPP_NUMBER = "51945553676";

/**
 * Número de WhatsApp (solo dígitos). NEXT_PUBLIC_WHATSAPP_NUMBER lo reemplaza;
 * sin definir, se usa el del consultorio. Si está definido pero no es un celular
 * peruano válido devuelve null y los botones se muestran deshabilitados (un
 * error de configuración no debe mandar mensajes a un número equivocado).
 */
export function readWhatsAppNumber(): string | null {
  const rawNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || CLINIC_WHATSAPP_NUMBER;

  const parsed = WhatsAppNumberSchema.safeParse(rawNumber);
  if (parsed.success) return parsed.data;

  if (!hasWarnedInvalidWhatsApp) {
    hasWarnedInvalidWhatsApp = true;
    console.warn("[env] NEXT_PUBLIC_WHATSAPP_NUMBER inválido (se espera 519XXXXXXXX): WhatsApp deshabilitado");
  }
  return null;
}

/** Clave pública de Cloudflare Turnstile; sin ella no se pide captcha (desarrollo local). */
export function readTurnstileSiteKey(): string | null {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  return siteKey && siteKey.length > 0 ? siteKey : null;
}
