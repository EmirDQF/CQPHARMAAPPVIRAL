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

  const parsedBody = consentGrantBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return { status: 400, error: `Consentimiento inválido (${describeValidationError(parsedBody.error)})` };
  }

  const row = consentInsertSchema.safeParse({
    purpose: parsedBody.data.purpose,
    policy_version: parsedBody.data.consent.consentVersion,
    granted_at: parsedBody.data.consent.consentAt,
    revoked_at: null,
  });
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
