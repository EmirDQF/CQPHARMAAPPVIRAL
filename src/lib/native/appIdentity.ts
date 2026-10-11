/**
 * Identidad de la app en un solo lugar. ANDROID_APP_ID debe coincidir con
 * `appId` de capacitor.config.ts (lo verifica appIdentity.test.ts): lo usan
 * assetlinks.json y los App Links. Pendiente del usuario: confirmar el appId
 * definitivo antes de la primera subida a Google Play (docs/BLOCKERS.md B2).
 */
export const ANDROID_APP_ID = "com.artikare.app";

/** Mismo valor por defecto que layout.tsx y capacitor.config.ts. */
export const DEFAULT_SITE_URL = "https://artikare.com";

export function readSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
}
