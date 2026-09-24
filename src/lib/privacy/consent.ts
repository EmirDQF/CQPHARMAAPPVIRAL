import { z } from "zod";

/**
 * Versión de la política de privacidad aceptada (Ley 29733). Cambiarla
 * obliga a pedir consentimiento nuevo: los registros guardan la versión que
 * el paciente aceptó, nunca se asume la vigente.
 */
export const CONSENT_VERSION = "2026-09-24-provisional";

export const PRIVACY_POLICY_PATH = "/privacidad";

export const consentRecordSchema = z.object({
  consentAt: z.iso.datetime(),
  consentVersion: z.string().min(1).max(64),
});

export type ConsentRecord = z.infer<typeof consentRecordSchema>;

export function createConsentRecord(now: Date = new Date()): ConsentRecord {
  return { consentAt: now.toISOString(), consentVersion: CONSENT_VERSION };
}
