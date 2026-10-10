import { z } from "zod";
import { MENOPAUSAL_STATUSES } from "../clinical/tScoreEligibility";
import type { PainLogEntry } from "../dashboard/types";
import { consentRecordSchema } from "../privacy/consent";
import type { BottleStart } from "../repositories/bottles";
import type { DexaScanValue } from "../repositories/dexaScans";
import type { DoseTaken } from "../repositories/doseEvents";
import type { ProfileValue } from "../repositories/profile";
import { STIFFNESS_BUCKETS } from "../schemas/painLog";
import { SEXES } from "../schemas/profile";
import type { ConflictRule } from "./planSync";

/**
 * Dominios que respalda C3, con su regla de conflicto. Lo comparten el
 * cliente (motor de sincronización) y el servidor (/api/sync).
 */
export interface SyncDomainValues {
  profile: ProfileValue;
  painLogs: PainLogEntry;
  dexaScans: DexaScanValue;
  doseEvents: DoseTaken;
  bottles: BottleStart;
}

export type SyncDomainName = keyof SyncDomainValues;

interface SyncDomainDefinition<T> {
  rule: ConflictRule;
  supportsDelete: boolean;
  /** Identidad del dato, sin `updatedAt` ni ids locales. */
  fingerprint: (value: T) => string;
}

export const SYNC_DOMAINS: { [K in SyncDomainName]: SyncDomainDefinition<SyncDomainValues[K]> } = {
  profile: {
    rule: "latest-updated-at",
    supportsDelete: false,
    fingerprint: (value) =>
      JSON.stringify([
        value.name,
        value.age,
        value.sex,
        value.weightKg,
        value.hasFractureHistory,
        value.menopausalStatus,
        value.allergies,
        value.phone,
      ]),
  },
  painLogs: {
    rule: "latest-updated-at",
    supportsDelete: true,
    fingerprint: (value) => JSON.stringify([value.date, value.painLevel, value.stiffness]),
  },
  dexaScans: {
    rule: "latest-updated-at",
    supportsDelete: true,
    fingerprint: (value) =>
      JSON.stringify([value.date, value.lumbarTScore, value.femoralNeckTScore, value.radiologyCenter]),
  },
  doseEvents: {
    rule: "union",
    supportsDelete: false,
    fingerprint: (value) => `${value.date}|${value.doseId}`,
  },
  bottles: {
    rule: "union",
    supportsDelete: false,
    fingerprint: (value) => `${value.productId}|${value.startedOn}`,
  },
};

export const SYNC_DOMAIN_NAMES = Object.keys(SYNC_DOMAINS) as SyncDomainName[];

/** Tope por lote: cada lote es una entrada de la outbox y una petición a /api/sync. */
export const SYNC_BATCH_MAX_ITEMS = 100;

// ─── Borde de /api/sync: forma del dato. Los límites clínicos los aplican los
// esquemas de fila de src/lib/schemas en los repositorios, y luego la base. ───
const isoDate = z.iso.date();
const editedAt = z.iso.datetime().optional();
const shortId = z.string().min(1).max(64);

const valueSchemas = {
  profile: z.object({
    name: z.string(),
    age: z.number().nullable(),
    sex: z.enum(SEXES).nullable(),
    weightKg: z.number().nullable(),
    hasFractureHistory: z.boolean().nullable(),
    menopausalStatus: z.enum(MENOPAUSAL_STATUSES).nullable(),
    allergies: z.string(),
    phone: z.string(),
    updatedAt: editedAt,
  }),
  painLogs: z.object({
    date: isoDate,
    painLevel: z.number(),
    stiffness: z.enum(STIFFNESS_BUCKETS),
    updatedAt: editedAt,
  }),
  dexaScans: z.object({
    date: isoDate,
    lumbarTScore: z.number(),
    femoralNeckTScore: z.number(),
    radiologyCenter: z.string(),
    updatedAt: editedAt,
  }),
  doseEvents: z.object({ date: isoDate, doseId: shortId }),
  bottles: z.object({ productId: shortId, startedOn: isoDate }),
};

function batchSchema<D extends SyncDomainName, V extends z.ZodType>(domain: D, valueSchema: V) {
  const deletes = SYNC_DOMAINS[domain].supportsDelete
    ? z.array(isoDate).max(SYNC_BATCH_MAX_ITEMS)
    : z.array(z.string()).max(0);
  return z.object({
    domain: z.literal(domain),
    upserts: z.array(valueSchema).max(SYNC_BATCH_MAX_ITEMS),
    deletes,
    // Ley 29733: la outbox exige el registro del consentimiento con datos personales.
    consent: consentRecordSchema,
  });
}

export const syncBatchBodySchema = z.discriminatedUnion("domain", [
  batchSchema("profile", valueSchemas.profile),
  batchSchema("painLogs", valueSchemas.painLogs),
  batchSchema("dexaScans", valueSchemas.dexaScans),
  batchSchema("doseEvents", valueSchemas.doseEvents),
  batchSchema("bottles", valueSchemas.bottles),
]);

export type SyncBatchBody = z.infer<typeof syncBatchBodySchema>;
