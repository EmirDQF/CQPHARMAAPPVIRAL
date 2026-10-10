import { z } from "zod";
import { notFutureTimestampSchema, ownedRowColumns, timestampSchema } from "./shared";

/** Finalidades del tratamiento de datos (Ley 29733) que registra `consents`. */
export const CONSENT_PURPOSES = ["perfil-clinico", "cita", "contacto-test"] as const;

const consentFields = {
  purpose: z.enum(CONSENT_PURPOSES),
  policy_version: z.string().min(1).max(64),
  revoked_at: timestampSchema.nullable(),
};

/** Replica `check (revoked_at is null or revoked_at >= granted_at)`. */
function isRevokedAfterGranted(consent: { granted_at: string; revoked_at: string | null }): boolean {
  return consent.revoked_at === null || Date.parse(consent.revoked_at) >= Date.parse(consent.granted_at);
}

const revokedAfterGrantedIssue = {
  message: "La revocación no puede ser anterior al consentimiento",
  path: ["revoked_at"],
};

/**
 * `consents` solo admite filas nuevas: una revocación es otra fila con
 * `revoked_at`, nunca una edición del consentimiento original.
 */
export const consentInsertSchema = z
  .object({ ...consentFields, granted_at: notFutureTimestampSchema })
  .refine(isRevokedAfterGranted, revokedAfterGrantedIssue);

/** Fila leída de Supabase: el límite contra "ahora" ya lo aplicó el reloj de la base. */
export const consentRowSchema = z
  .object({ ...consentFields, granted_at: timestampSchema, ...ownedRowColumns })
  .refine(isRevokedAfterGranted, revokedAfterGrantedIssue);

export type ConsentInsert = z.infer<typeof consentInsertSchema>;
export type ConsentRow = z.infer<typeof consentRowSchema>;
