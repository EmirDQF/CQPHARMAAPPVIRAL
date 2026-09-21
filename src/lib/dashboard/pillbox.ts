import { createPersistentStore } from "../storage/persistentStore";
import { doseSchedule } from "./mockData";
import type { PillboxState } from "./types";

const store = createPersistentStore<PillboxState>("artikare_pillbox_v1", {
  takenDoseIdsByDate: {},
});

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function markDoseTaken(doseId: string): void {
  const current = store.getSnapshot();
  const date = todayIsoDate();
  const takenToday = current.takenDoseIdsByDate[date] ?? [];
  if (takenToday.includes(doseId)) return;

  store.write({
    takenDoseIdsByDate: {
      ...current.takenDoseIdsByDate,
      [date]: [...takenToday, doseId],
    },
  });
}

function isDoseComplete(state: PillboxState, date: string): boolean {
  const taken = new Set(state.takenDoseIdsByDate[date] ?? []);
  return doseSchedule.every((dose) => taken.has(dose.id));
}

/**
 * Cuenta días consecutivos (terminando hoy) en los que se tomaron todas
 * las dosis programadas. Se deriva del historial en vez de guardarse como
 * contador aparte, para que nunca se desincronice de los datos reales.
 */
export function calculateStreakDays(
  state: PillboxState,
  referenceDate: Date = new Date()
): number {
  let streak = 0;
  const cursor = new Date(referenceDate);

  while (isDoseComplete(state, cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export const pillboxStore = store;
