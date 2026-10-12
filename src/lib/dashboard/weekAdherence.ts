import { DOSE_SCHEDULE } from "@/lib/clinical/constants";
import { lastNIsoDates } from "@/lib/utils/date";

export type DayAdherence = "complete" | "partial" | "none";

export interface WeekDay {
  isoDate: string;
  /** Inicial del día en español (L, M, X, J, V, S, D). */
  weekdayLetter: string;
  takenCount: number;
  adherence: DayAdherence;
  isToday: boolean;
}

const WEEKDAY_LETTERS = ["D", "L", "M", "X", "J", "V", "S"] as const;
const WEEK_LENGTH = 7;

function weekdayLetter(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return WEEKDAY_LETTERS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

/** Últimos 7 días de Lima (el más antiguo primero) con las tomas registradas de cada uno. */
export function buildWeekAdherence(
  takenDoseIdsByDate: Readonly<Record<string, readonly string[]>>,
  now: Date,
): WeekDay[] {
  const scheduleIds = new Set(DOSE_SCHEDULE.map((dose) => dose.id));
  return lastNIsoDates(WEEK_LENGTH, now)
    .map((isoDate, index) => {
      const takenCount = (takenDoseIdsByDate[isoDate] ?? []).filter((id) => scheduleIds.has(id)).length;
      const adherence: DayAdherence =
        takenCount === 0 ? "none" : takenCount >= DOSE_SCHEDULE.length ? "complete" : "partial";
      return { isoDate, weekdayLetter: weekdayLetter(isoDate), takenCount, adherence, isToday: index === 0 };
    })
    .reverse();
}
