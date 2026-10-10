import { DOSE_SCHEDULE } from "../clinical/constants";
import { pillboxStore } from "../dashboard/pillbox";
import { doseEventInsertSchema, doseEventRowSchema } from "../schemas/doseEvent";
import { keepValid, selectRows, upsertRows, type RepositoryClient } from "./supabaseRows";
import type { RecordRepository, SyncRecord } from "./types";

/** Toma registrada en el pastillero: horario + día de Lima. */
export interface DoseTaken {
  date: string;
  doseId: string;
}

/**
 * Una toma por horario y día (UNIQUE user_id, dose_id, taken_on). En conflicto
 * se hace la unión: una toma registrada en cualquier celular cuenta, y no hay
 * borrado de tomas en la app.
 */
export type DoseEventRepository = RecordRepository<DoseTaken>;

const TABLE = "dose_events";
/** Lima no tiene horario de verano: siempre UTC-5. */
const LIMA_UTC_OFFSET = "-05:00";
const listedRowSchema = doseEventRowSchema.pick({ dose_id: true, taken_on: true });

function toRecord(value: DoseTaken): SyncRecord<DoseTaken> {
  return { key: `${value.date}|${value.doseId}`, value, updatedAt: null };
}

/**
 * El pastillero local no guarda la hora exacta de la toma: se usa la hora
 * programada de ese día en Lima, sin pasar de "ahora" (la base rechaza horas futuras).
 */
export function scheduledTakenAt(date: string, time24h: string, now: Date = new Date()): string {
  const scheduled = new Date(`${date}T${time24h}:00${LIMA_UTC_OFFSET}`);
  return (scheduled > now ? now : scheduled).toISOString();
}

export function createLocalDoseEventRepository(): DoseEventRepository {
  return {
    async list() {
      return Object.entries(pillboxStore.getSnapshot().takenDoseIdsByDate).flatMap(([date, doseIds]) =>
        doseIds.map((doseId) => toRecord({ date, doseId }))
      );
    },
    async upsertMany(values) {
      const current = pillboxStore.getSnapshot().takenDoseIdsByDate;
      const merged = values.reduce<Record<string, string[]>>((byDate, { date, doseId }) => {
        const taken = byDate[date] ?? [];
        return taken.includes(doseId) ? byDate : { ...byDate, [date]: [...taken, doseId] };
      }, current);
      if (merged !== current) pillboxStore.write({ takenDoseIdsByDate: merged });
    },
  };
}

export function createSupabaseDoseEventRepository(client: RepositoryClient): DoseEventRepository {
  return {
    async list() {
      const rows = await selectRows(client, TABLE, "dose_id, taken_on", listedRowSchema);
      return rows.map((row) => toRecord({ date: row.taken_on, doseId: row.dose_id }));
    },
    async upsertMany(values) {
      const now = new Date();
      const candidates = values.map(({ date, doseId }) => {
        const dose = DOSE_SCHEDULE.find((scheduled) => scheduled.id === doseId);
        return dose
          ? {
              dose_id: doseId,
              product_id: dose.productId,
              taken_on: date,
              taken_at: scheduledTakenAt(date, dose.time, now),
            }
          : { dose_id: doseId };
      });
      const rows = keepValid(candidates, doseEventInsertSchema, TABLE);
      await upsertRows(client, TABLE, rows, {
        onConflict: "user_id,dose_id,taken_on",
        ignoreDuplicates: true,
      });
    },
  };
}
