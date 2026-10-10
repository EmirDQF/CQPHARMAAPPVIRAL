import type { ConsentRecord } from "../privacy/consent";
import { createLocalBottleRepository } from "../repositories/bottles";
import { createLocalDexaScanRepository } from "../repositories/dexaScans";
import { createLocalDoseEventRepository } from "../repositories/doseEvents";
import { createLocalPainLogRepository } from "../repositories/painLogs";
import { createLocalProfileRepository } from "../repositories/profile";
import type { RecordRepository, SyncRecord } from "../repositories/types";
import {
  SYNC_BATCH_MAX_ITEMS,
  SYNC_DOMAINS,
  SYNC_DOMAIN_NAMES,
  type SyncDomainName,
  type SyncDomainValues,
} from "./domains";
import { planDomainSync, type DomainSyncPlan } from "./planSync";
import { readBasesFor, saveBasesFor, type SyncBases } from "./syncState";

export type LocalSyncRepositories = {
  [K in SyncDomainName]: RecordRepository<SyncDomainValues[K]> & {
    deleteMany?: (keys: readonly string[]) => Promise<void>;
  };
};

export type RemoteSyncReaders = {
  [K in SyncDomainName]: Pick<RecordRepository<SyncDomainValues[K]>, "list">;
};

/** Cuerpo de un lote para /api/sync (lo valida `syncBatchBodySchema` en el servidor). */
export interface OutgoingSyncBatch {
  domain: SyncDomainName;
  upserts: SyncDomainValues[SyncDomainName][];
  deletes: string[];
  consent: ConsentRecord;
}

export interface AccountSyncDependencies {
  userId: string;
  /** Consentimiento `respaldo-cuenta` dado en este celular. */
  consent: ConsentRecord;
  local: LocalSyncRepositories;
  /** Lectura de la cuenta con la sesión del paciente (RLS). */
  remote: RemoteSyncReaders;
  isConsentActiveOnServer: () => Promise<boolean>;
  /** Encola en la outbox; false si no se pudo encolar (se reintenta en el próximo pase). */
  enqueue: (batch: OutgoingSyncBatch) => boolean;
}

export type AccountSyncOutcome =
  | { status: "synced"; downloaded: number; queuedForUpload: number }
  | { status: "waiting-consent" }
  | { status: "failed" };

type DomainRecords = {
  [K in SyncDomainName]: { local: SyncRecord<SyncDomainValues[K]>[]; remote: SyncRecord<SyncDomainValues[K]>[] };
};

export function createLocalSyncRepositories(): LocalSyncRepositories {
  return {
    profile: createLocalProfileRepository(),
    painLogs: createLocalPainLogRepository(),
    dexaScans: createLocalDexaScanRepository(),
    doseEvents: createLocalDoseEventRepository(),
    bottles: createLocalBottleRepository(),
  };
}

async function readDomain<K extends SyncDomainName>(name: K, deps: AccountSyncDependencies) {
  const [local, remote] = await Promise.all([deps.local[name].list(), deps.remote[name].list()]);
  return { local, remote };
}

/** Todo se lee antes de tocar nada: si la cuenta no responde, el celular queda intacto. */
async function readAllDomains(deps: AccountSyncDependencies): Promise<DomainRecords> {
  const [profile, painLogs, dexaScans, doseEvents, bottles] = await Promise.all([
    readDomain("profile", deps),
    readDomain("painLogs", deps),
    readDomain("dexaScans", deps),
    readDomain("doseEvents", deps),
    readDomain("bottles", deps),
  ]);
  return { profile, painLogs, dexaScans, doseEvents, bottles };
}

function enqueueInBatches<K extends SyncDomainName>(
  name: K,
  plan: DomainSyncPlan<SyncDomainValues[K]>,
  deps: AccountSyncDependencies
): number {
  const total = Math.max(plan.uploadRemote.length, plan.deleteRemote.length);
  let queued = 0;
  for (let start = 0; start < total; start += SYNC_BATCH_MAX_ITEMS) {
    const batch: OutgoingSyncBatch = {
      domain: name,
      upserts: plan.uploadRemote.slice(start, start + SYNC_BATCH_MAX_ITEMS),
      deletes: plan.deleteRemote.slice(start, start + SYNC_BATCH_MAX_ITEMS),
      consent: deps.consent,
    };
    if (deps.enqueue(batch)) queued += batch.upserts.length + batch.deletes.length;
  }
  return queued;
}

async function syncDomain<K extends SyncDomainName>(
  name: K,
  records: DomainRecords[K],
  base: Record<string, string>,
  canUpload: boolean,
  deps: AccountSyncDependencies
) {
  const definition = SYNC_DOMAINS[name];
  const plan = planDomainSync<SyncDomainValues[K]>({ ...records, base, ...definition });
  const local = deps.local[name];

  if (plan.applyLocal.length > 0) await local.upsertMany(plan.applyLocal);
  if (plan.deleteLocal.length > 0) await local.deleteMany?.(plan.deleteLocal);
  const queued = canUpload ? enqueueInBatches(name, plan, deps) : 0;

  return { nextBase: plan.nextBase, downloaded: plan.applyLocal.length + plan.deleteLocal.length, queued };
}

/**
 * Un pase de respaldo (C3): lee celular y cuenta, fusiona cada dominio con su
 * regla, aplica lo remoto en el celular (lo reemplazado va a la papelera) y
 * encola lo local para /api/sync. Sin el consentimiento confirmado en la
 * cuenta solo baja datos: no sube nada hasta que el servidor lo tenga.
 */
export async function runAccountSync(deps: AccountSyncDependencies): Promise<AccountSyncOutcome> {
  try {
    const [records, canUpload] = await Promise.all([readAllDomains(deps), deps.isConsentActiveOnServer()]);
    const bases = readBasesFor(deps.userId);
    const nextBases: SyncBases = {};
    let downloaded = 0;
    let queued = 0;

    for (const name of SYNC_DOMAIN_NAMES) {
      const result = await syncDomain(name, records[name], bases[name] ?? {}, canUpload, deps);
      nextBases[name] = result.nextBase;
      downloaded += result.downloaded;
      queued += result.queued;
    }

    saveBasesFor(deps.userId, nextBases);
    return canUpload ? { status: "synced", downloaded, queuedForUpload: queued } : { status: "waiting-consent" };
  } catch (error) {
    console.error("[sync] Pase de respaldo interrumpido", error instanceof Error ? error.message : "error desconocido");
    return { status: "failed" };
  }
}
