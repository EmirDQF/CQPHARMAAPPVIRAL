import { z } from "zod";

/**
 * Digital Asset Links para Android App Links. Las huellas SHA-256 del
 * certificado de firma vienen de ANDROID_SHA256_FINGERPRINT (varias separadas
 * por coma, p. ej. la de subida y la de Play App Signing). Si falta alguna o
 * no tiene el formato AA:BB:… de 32 bytes, se publica `[]`: nunca una huella
 * inventada ni parcial.
 */
const FINGERPRINT_PATTERN = /^[0-9A-F]{2}(?::[0-9A-F]{2}){31}$/;

const fingerprintListSchema = z
  .string()
  .transform((raw) =>
    raw
      .split(",")
      .map((value) => value.trim().toUpperCase())
      .filter((value) => value.length > 0)
  )
  .pipe(z.array(z.string().regex(FINGERPRINT_PATTERN)).min(1));

/** Caché larga con huellas válidas; corta sin ellas, para que se note pronto al configurarlas. */
export const ASSET_LINKS_CACHE_CONTROL = {
  configured: "public, max-age=3600",
  missing: "public, max-age=300",
} as const;

export interface AssetLinkStatement {
  relation: ["delegate_permission/common.handle_all_urls"];
  target: { namespace: "android_app"; package_name: string; sha256_cert_fingerprints: string[] };
}

/** null si falta o alguna huella es inválida. */
export function parseAndroidFingerprints(raw: string | undefined): string[] | null {
  const parsed = fingerprintListSchema.safeParse(raw);
  return parsed.success ? [...new Set(parsed.data)] : null;
}

export function buildAssetLinks(packageName: string, fingerprints: readonly string[] | null): AssetLinkStatement[] {
  if (!fingerprints || fingerprints.length === 0) return [];
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: { namespace: "android_app", package_name: packageName, sha256_cert_fingerprints: [...fingerprints] },
    },
  ];
}
