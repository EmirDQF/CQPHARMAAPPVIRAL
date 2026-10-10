import { createSupabaseBottleRepository } from "../repositories/bottles";
import { createSupabaseConsentRepository } from "../repositories/consents";
import { createSupabaseDexaScanRepository } from "../repositories/dexaScans";
import { createSupabaseDoseEventRepository } from "../repositories/doseEvents";
import { createSupabasePainLogRepository } from "../repositories/painLogs";
import { createSupabaseProfileRepository } from "../repositories/profile";
import type { RepositoryClient } from "../repositories/supabaseRows";
import { syncBatchBodySchema, type SyncBatchBody, type SyncDomainName } from "../sync/domains";
import { describeValidationError } from "./schemas";

/** Quién envía el lote, según la sesión validada en el servidor (nunca según el cuerpo). */
export interface SyncRequester {
  id: string;
  isAnonymous: boolean;
}

export type SyncHandlerResult =
  | { status: 200; data: { domain: SyncDomainName; upserted: number; deleted: number } }
  | { status: 400 | 401 | 403 | 503; error: string };

interface SyncBatchRequest {
  client: RepositoryClient;
  requester: SyncRequester | null;
  body: unknown;
}

async function writeBatch(client: RepositoryClient, batch: SyncBatchBody): Promise<void> {
  switch (batch.domain) {
    case "profile":
      return createSupabaseProfileRepository(client).upsertMany(batch.upserts);
    case "painLogs": {
      const repository = createSupabasePainLogRepository(client);
      await repository.upsertMany(batch.upserts);
      return repository.deleteMany(batch.deletes);
    }
    case "dexaScans": {
      const repository = createSupabaseDexaScanRepository(client);
      await repository.upsertMany(batch.upserts);
      return repository.deleteMany(batch.deletes);
    }
    case "doseEvents":
      return createSupabaseDoseEventRepository(client).upsertMany(batch.upserts);
    case "bottles":
      return createSupabaseBottleRepository(client).upsertMany(batch.upserts);
  }
}

/**
 * Guarda un lote de respaldo (C3) con el cliente de la sesión, así toda
 * escritura pasa por RLS. Orden: cuenta → forma del lote → consentimiento
 * `respaldo-cuenta` vigente EN LA BASE → escritura. Un fallo de la base
 * responde 503 para que la outbox reintente en vez de descartar el lote.
 */
export async function handleSyncBatch({ client, requester, body }: SyncBatchRequest): Promise<SyncHandlerResult> {
  if (!requester || requester.isAnonymous) {
    return { status: 401, error: "Se requiere una cuenta para respaldar registros" };
  }

  const parsed = syncBatchBodySchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, error: `Lote de respaldo inválido (${describeValidationError(parsed.error)})` };
  }

  try {
    const hasConsent = await createSupabaseConsentRepository(client).hasActive("respaldo-cuenta");
    if (!hasConsent) return { status: 403, error: "Falta el consentimiento para respaldar registros" };
    await writeBatch(client, parsed.data);
  } catch (error) {
    console.error("[sync] No se pudo guardar el lote", error instanceof Error ? error.message : "error desconocido");
    return { status: 503, error: "El respaldo no está disponible por el momento" };
  }

  return {
    status: 200,
    data: {
      domain: parsed.data.domain,
      upserted: parsed.data.upserts.length,
      deleted: parsed.data.deletes.length,
    },
  };
}
