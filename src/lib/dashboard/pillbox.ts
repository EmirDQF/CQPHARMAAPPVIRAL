import { DOSE_SCHEDULE } from "../clinical/constants";
import { computeGraceStreak, type StreakSummary } from "../gamification/graceStreak";
import { createPersistentStore } from "../storage/persistentStore";
import { toLimaIsoDate } from "../utils/date";
import type { PillboxState } from "./types";

const store = createPersistentStore<PillboxState>("artikare_pillbox_v1", {
  takenDoseIdsByDate: {},
});

/** `date` = día de Lima en que el paciente tocó la toma (por defecto, hoy). */
export function markDoseTaken(doseId: string, date: string = toLimaIsoDate()): void {
  const current = store.getSnapshot();
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

export type { StreakSummary } from "../gamification/graceStreak";

/**
 * Racha del pastillero: un día cuenta si se anotaron todas las tomas. Usa el
 * mismo algoritmo con días de gracia que el juego (`computeGraceStreak`).
 */
export function calculateStreak(state: PillboxState, referenceDate: Date = new Date()): StreakSummary {
  const completeDates = Object.keys(state.takenDoseIdsByDate).filter((date) => isDoseComplete(state, date));
  return computeGraceStreak(new Set(completeDates), toLimaIsoDate(referenceDate));
}

/** Días de la racha vigente; ver `calculateStreak`. */
export function calculateStreakDays(
  state: PillboxState,
  referenceDate: Date = new Date()
): number {
  return calculateStreak(state, referenceDate).days;
}

export const pillboxStore = store;
