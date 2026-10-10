import { z } from "zod";
import { consentRecordSchema } from "../privacy/consent";
import { createSupabaseConsentRepository } from "../repositories/consents";
import type { RepositoryClient } from "../repositories/supabaseRows";
import { consentInsertSchema } from "../schemas/consent";
import type { SyncRequester } from "./handleSyncBatch";
import { describeValidationError } from "./schemas";

/** Por ahora solo el respaldo en la cuenta (C3) registra su consentimiento por esta vía. */
export const consentGrantBodySchema = z.object({
  purpose: z.literal("respaldo-cuenta"),
  consent: consentRecordSchema,
});

/** Derecho de oposición (C5): retirar el respaldo es otra fila, con `revoked_at`. */
export const consentRevokeBodySchema = z.object({
  purpose: z.literal("respaldo-cuenta"),
  revokedAt: z.iso.datetime(),
  consentVersion: z.string().min(1).max(64),
});

const consentEventBodySchema = z.union([consentGrantBodySchema, consentRevokeBodySchema]);

function toConsentRow(body: z.infer<typeof consentEventBodySchema>) {
  if ("consent" in body) {
    return {
      purpose: body.purpose,
      policy_version: body.consent.consentVersion,
      granted_at: body.consent.consentAt,
      revoked_at: null,
    };
  }
  return {
    purpose: body.purpose,
    policy_version: body.consentVersion,
    granted_at: body.revokedAt,
    revoked_at: body.revokedAt,
  };
}

export type ConsentGrantResult =
  | { status: 201; data: { purpose: "respaldo-cuenta" } }
  | { status: 400 | 401 | 503; error: string };

interface ConsentGrantRequest {
  client: RepositoryClient;
  requester: SyncRequester | null;
  body: unknown;
}

/**
 * Registra en `consents` el consentimiento dado en el celular, con su versión
 * de política y su hora. Un reintento puede repetir la fila: `consents` es un
 * registro de eventos y la vigencia se calcula con `isConsentActive`.
 */
export async function handleConsentGrant({ client, requester, body }: ConsentGrantRequest): Promise<ConsentGrantResult> {
  if (!requester || requester.isAnonymous) {
    return { status: 401, error: "Se requiere una cuenta para registrar el consentimiento" };
  }

  const parsedBody = consentEventBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return { status: 400, error: `Consentimiento inválido (${describeValidationError(parsedBody.error)})` };
  }

  const row = consentInsertSchema.safeParse(toConsentRow(parsedBody.data));
  if (!row.success) {
    return { status: 400, error: `Consentimiento inválido (${describeValidationError(row.error)})` };
  }

  try {
    await createSupabaseConsentRepository(client).record(row.data);
  } catch (error) {
    console.error("[consents] No se pudo registrar", error instanceof Error ? error.message : "error desconocido");
    return { status: 503, error: "No se pudo registrar el consentimiento por el momento" };
  }
  return { status: 201, data: { purpose: "respaldo-cuenta" } };
}
