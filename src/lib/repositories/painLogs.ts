import { painLogStore } from "../dashboard/painLog";
import { softDeletePainLog } from "../dashboard/recordDeletion";
import type { PainLogEntry } from "../dashboard/types";
import { painLogInsertSchema, painLogRowSchema } from "../schemas/painLog";
import {
  keepValid,
  selectRows,
  softDeleteWhereIn,
  upsertRows,
  type RepositoryClient,
} from "./supabaseRows";
import type { DeletableRecordRepository, SyncRecord } from "./types";

/** Diario de dolor: un registro por día de Lima (UNIQUE user_id, log_date). */
export type PainLogRepository = DeletableRecordRepository<PainLogEntry>;

const TABLE = "pain_logs";
const LIST_COLUMNS = "log_date, pain_level, stiffness, updated_at";
const listedRowSchema = painLogRowSchema.pick({
  log_date: true,
  pain_level: true,
  stiffness: true,
  updated_at: true,
});

function toRecord(entry: PainLogEntry): SyncRecord<PainLogEntry> {
  return { key: entry.date, value: entry, updatedAt: entry.updatedAt ?? null };
}

function hasSameReading(a: PainLogEntry, b: PainLogEntry): boolean {
  return a.painLevel === b.painLevel && a.stiffness === b.stiffness;
}

function byDate(a: PainLogEntry, b: PainLogEntry): number {
  return a.date.localeCompare(b.date);
}

export function createLocalPainLogRepository(): PainLogRepository {
  return {
    async list() {
      return painLogStore.getSnapshot().map(toRecord);
    },
    /** Lo que se reemplaza con otro valor va a la papelera: restaurable, nunca perdido. */
    async upsertMany(values) {
      for (const value of values) {
        const existing = painLogStore.getSnapshot().find((entry) => entry.date === value.date);
        if (existing && !hasSameReading(existing, value)) softDeletePainLog(value.date);
        const others = painLogStore.getSnapshot().filter((entry) => entry.date !== value.date);
        painLogStore.write([...others, value].sort(byDate));
      }
    },
    async deleteMany(dates) {
      dates.forEach((date) => softDeletePainLog(date));
    },
  };
}

export function createSupabasePainLogRepository(client: RepositoryClient): PainLogRepository {
  return {
    async list() {
      const rows = await selectRows(client, TABLE, LIST_COLUMNS, listedRowSchema);
      return rows.map((row) =>
        toRecord({
          date: row.log_date,
          painLevel: row.pain_level,
          stiffness: row.stiffness,
          updatedAt: row.updated_at,
        })
      );
    },
    async upsertMany(values) {
      const candidates = values.map((value) => ({
        log_date: value.date,
        pain_level: value.painLevel,
        stiffness: value.stiffness,
      }));
      const rows = keepValid(candidates, painLogInsertSchema, TABLE);
      await upsertRows(client, TABLE, rows, { onConflict: "user_id,log_date" });
    },
    async deleteMany(dates) {
      await softDeleteWhereIn(client, TABLE, "log_date", dates);
    },
  };
}
