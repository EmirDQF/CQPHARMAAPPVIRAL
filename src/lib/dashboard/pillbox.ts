import { DOSE_SCHEDULE } from "../clinical/constants";
import { createPersistentStore } from "../storage/persistentStore";
import { addDaysToIsoDate, toLimaIsoDate } from "../utils/date";
import type { PillboxState } from "./types";

const store = createPersistentStore<PillboxState>("artikare_pillbox_v1", {
  takenDoseIdsByDate: {},
});

export function markDoseTaken(doseId: string): void {
  const current = store.getSnapshot();
  const date = toLimaIsoDate();
  const takenToday = current.takenDoseIdsByDate[date] ?? [];
  if (takenToday.includes(doseId)) return;

  store.write({
    takenDoseIdsByDate: {
      ...current.takenDoseIdsByDate,
      [date]: [...takenToday, doseId],
    },
  });
}

export function isDoseComplete(state: PillboxState, date: string): boolean {
  const taken = new Set(state.takenDoseIdsByDate[date] ?? []);
  return DOSE_SCHEDULE.every((dose) => taken.has(dose.id));
}

/**
 * Cuenta días consecutivos (terminando hoy, en hora de Lima) en los que se
 * tomaron todas las dosis programadas. Se deriva del historial en vez de
 * guardarse como contador aparte, para que nunca se desincronice.
 */
export function calculateStreakDays(
  state: PillboxState,
  referenceDate: Date = new Date()
): number {
  let streak = 0;
  let cursor = toLimaIsoDate(referenceDate);

  while (isDoseComplete(state, cursor)) {
    streak += 1;
    cursor = addDaysToIsoDate(cursor, -1);
  }

  return streak;
}

export const pillboxStore = store;
