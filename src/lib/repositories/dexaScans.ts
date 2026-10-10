import { dexaVaultStore, type DexaScanEntry } from "../dashboard/dexaVault";
import { softDeleteDexaScan } from "../dashboard/recordDeletion";
import { dexaScanInsertSchema, dexaScanRowSchema } from "../schemas/dexaScan";
import {
  keepValid,
  selectRows,
  softDeleteWhereIn,
  upsertRows,
  type RepositoryClient,
} from "./supabaseRows";
import type { DeletableRecordRepository, SyncRecord } from "./types";

/** Densitometría sin el id local (`dexa-<ms>`), que no existe en la base. */
export type DexaScanValue = Omit<DexaScanEntry, "id">;

/** Un estudio por día y paciente (UNIQUE user_id, scan_date). */
export type DexaScanRepository = DeletableRecordRepository<DexaScanValue>;

const TABLE = "dexa_scans";
const LIST_COLUMNS = "scan_date, lumbar_t, femoral_t, radiology_center, updated_at";
const listedRowSchema = dexaScanRowSchema.pick({
  scan_date: true,
  lumbar_t: true,
  femoral_t: true,
  radiology_center: true,
  updated_at: true,
});

function toValue(entry: DexaScanEntry): DexaScanValue {
  const { date, lumbarTScore, femoralNeckTScore, radiologyCenter, updatedAt } = entry;
  return { date, lumbarTScore, femoralNeckTScore, radiologyCenter, ...(updatedAt ? { updatedAt } : {}) };
}

function toRecord(value: DexaScanValue): SyncRecord<DexaScanValue> {
  return { key: value.date, value, updatedAt: value.updatedAt ?? null };
}

function hasSameReading(a: DexaScanValue, b: DexaScanValue): boolean {
  return (
    a.lumbarTScore === b.lumbarTScore &&
    a.femoralNeckTScore === b.femoralNeckTScore &&
    a.radiologyCenter === b.radiologyCenter
  );
}

function byDate(a: DexaScanEntry, b: DexaScanEntry): number {
  return a.date.localeCompare(b.date);
}

function applyRemoteScan(value: DexaScanValue): void {
  const sameDay = dexaVaultStore.getSnapshot().filter((entry) => entry.date === value.date);
  const [onlyMatch] = sameDay;
  const keepsLocalId = sameDay.length === 1 && hasSameReading(onlyMatch, value);

  if (!keepsLocalId) sameDay.forEach((entry) => softDeleteDexaScan(entry.id));
  const replacement: DexaScanEntry = keepsLocalId
    ? { ...onlyMatch, ...value }
    : { ...value, id: `dexa-${Date.now()}-${value.date}` };

  const others = dexaVaultStore.getSnapshot().filter((entry) => entry.date !== value.date);
  dexaVaultStore.write([...others, replacement].sort(byDate));
}

export function createLocalDexaScanRepository(): DexaScanRepository {
  return {
    /** Con dos estudios locales del mismo día gana el último registrado (la base admite uno). */
    async list() {
      const latestByDate = new Map<string, DexaScanEntry>();
      dexaVaultStore.getSnapshot().forEach((entry) => latestByDate.set(entry.date, entry));
      return [...latestByDate.values()].map((entry) => toRecord(toValue(entry)));
    },
    /** Lo que se reemplaza con otros valores va a la papelera: restaurable, nunca perdido. */
    async upsertMany(values) {
      values.forEach(applyRemoteScan);
    },
    async deleteMany(dates) {
      dexaVaultStore
        .getSnapshot()
        .filter((entry) => dates.includes(entry.date))
        .forEach((entry) => softDeleteDexaScan(entry.id));
    },
  };
}

export function createSupabaseDexaScanRepository(client: RepositoryClient): DexaScanRepository {
  return {
    async list() {
      const rows = await selectRows(client, TABLE, LIST_COLUMNS, listedRowSchema);
      return rows.map((row) =>
        toRecord({
          date: row.scan_date,
          lumbarTScore: row.lumbar_t,
          femoralNeckTScore: row.femoral_t,
          radiologyCenter: row.radiology_center,
          updatedAt: row.updated_at,
        })
      );
    },
    async upsertMany(values) {
      const candidates = values.map((value) => ({
        scan_date: value.date,
        lumbar_t: value.lumbarTScore,
        femoral_t: value.femoralNeckTScore,
        radiology_center: value.radiologyCenter,
      }));
      const rows = keepValid(candidates, dexaScanInsertSchema, TABLE);
      await upsertRows(client, TABLE, rows, { onConflict: "user_id,scan_date" });
    },
    async deleteMany(dates) {
      await softDeleteWhereIn(client, TABLE, "scan_date", dates);
    },
  };
}
