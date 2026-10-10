import { DOSE_SCHEDULE, STREAK_DAYS_PER_SHIELD, STREAK_MAX_SHIELDS } from "../clinical/constants";
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

export interface StreakSummary {
  /** Días completos de la racha vigente (los días cubiertos por un escudo no suman). */
  days: number;
  /** Escudos de Constancia disponibles. */
  shields: number;
  todayComplete: boolean;
  /** Último día de la racha vigente que cubrió un escudo, o null. */
  shieldUsedOn: string | null;
}

const EMPTY_STREAK: StreakSummary = { days: 0, shields: 0, todayComplete: false, shieldUsedOn: null };

function earliestCompleteDate(state: PillboxState): string | null {
  const completeDates = Object.keys(state.takenDoseIdsByDate)
    .filter((date) => isDoseComplete(state, date))
    .sort();
  return completeDates[0] ?? null;
}

/**
 * Racha justa derivada del historial (hora de Lima), nunca guardada como
 * contador aparte:
 * - Si hoy sigue pendiente, la racha cuenta hasta ayer (no cae a 0 cada mañana).
 * - Cada `STREAK_DAYS_PER_SHIELD` días completos se gana un Escudo de
 *   Constancia (máx. `STREAK_MAX_SHIELDS`), que cubre solo un día perdido.
 * - Un día perdido sin escudo reinicia la racha y los escudos.
 */
export function calculateStreak(
  state: PillboxState,
  referenceDate: Date = new Date()
): StreakSummary {
  const today = toLimaIsoDate(referenceDate);
  const firstDate = earliestCompleteDate(state);
  if (!firstDate || firstDate > today) return EMPTY_STREAK;

  const todayComplete = isDoseComplete(state, today);
  const lastDate = todayComplete ? today : addDaysToIsoDate(today, -1);

  let days = 0;
  let shields = 0;
  let daysTowardShield = 0;
  let shieldUsedOn: string | null = null;

  for (let cursor = firstDate; cursor <= lastDate; cursor = addDaysToIsoDate(cursor, 1)) {
    if (isDoseComplete(state, cursor)) {
      days += 1;
      daysTowardShield += 1;
      if (daysTowardShield === STREAK_DAYS_PER_SHIELD) {
        shields = Math.min(STREAK_MAX_SHIELDS, shields + 1);
        daysTowardShield = 0;
      }
    } else if (shields > 0) {
      shields -= 1;
      shieldUsedOn = cursor;
    } else {
      days = 0;
      daysTowardShield = 0;
      shieldUsedOn = null;
    }
  }

  return { days, shields, todayComplete, shieldUsedOn };
}

/** Días de la racha vigente; ver `calculateStreak`. */
export function calculateStreakDays(
  state: PillboxState,
  referenceDate: Date = new Date()
): number {
  return calculateStreak(state, referenceDate).days;
}

export const pillboxStore = store;
