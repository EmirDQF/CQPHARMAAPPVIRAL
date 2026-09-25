import { z } from "zod";
import { ownedRowColumns, timestampSchema } from "./shared";

/** Finalidades del tratamiento de datos (Ley 29733) que registra `consents`. */
export const CONSENT_PURPOSES = ["perfil-clinico", "cita", "contacto-test"] as const;

/**
 * `consents` solo admite filas nuevas: una revocación es otra fila con
 * `revoked_at`, nunca una edición del consentimiento original.
 */
export const consentInsertSchema = z.object({
  purpose: z.enum(CONSENT_PURPOSES),
  policy_version: z.string().min(1).max(64),
  granted_at: timestampSchema,
  revoked_at: timestampSchema.nullable(),
});

export const consentRowSchema = consentInsertSchema.extend(ownedRowColumns);

export type ConsentInsert = z.infer<typeof consentInsertSchema>;
export type ConsentRow = z.infer<typeof consentRowSchema>;
