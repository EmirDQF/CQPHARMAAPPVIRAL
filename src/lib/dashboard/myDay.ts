import { CLINIC_TIME_ZONE, DOSE_SCHEDULE } from "../clinical/constants";
import { limaMinutesOfDay, time24hToMinutes } from "../utils/date";

/**
 * Lógica pura de la pantalla "Mi día" (/app). Todo en hora de Lima. El
 * progreso cuenta cada toma programada una sola vez más el chequeo diario: un
 * toque extra nunca suma (sin presión para tomar de más).
 */
const MORNING_START = time24hToMinutes("05:00");
const AFTERNOON_START = time24hToMinutes("12:00");
const NIGHT_START = time24hToMinutes("19:00");
/** El chequeo diario cuenta como una tarea más del día. */
const DAILY_CHECK_IN_TASKS = 1;

const longDateFormatter = new Intl.DateTimeFormat("es-PE", {
  timeZone: CLINIC_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function limaGreeting(now: Date = new Date()): string {
  const minutes = limaMinutesOfDay(now);
  if (minutes >= NIGHT_START) return "Buenas noches";
  if (minutes >= AFTERNOON_START) return "Buenas tardes";
  return minutes >= MORNING_START ? "Buenos días" : "Buenas noches";
}

export function formatLimaLongDate(now: Date = new Date()): string {
  return longDateFormatter.format(now);
}

export type DoseSlotStatus = "taken" | "due" | "upcoming";

export function doseSlotStatus(doseTime: string, isTaken: boolean, now: Date = new Date()): DoseSlotStatus {
  if (isTaken) return "taken";
  return limaMinutesOfDay(now) >= time24hToMinutes(doseTime) ? "due" : "upcoming";
}

export interface DayProgress {
  done: number;
  total: number;
  ratio: number;
}

export function buildDayProgress(takenDoseIds: readonly string[], checkInDone: boolean): DayProgress {
  const taken = new Set(takenDoseIds);
  const dosesDone = DOSE_SCHEDULE.filter((dose) => taken.has(dose.id)).length;
  const done = dosesDone + (checkInDone ? DAILY_CHECK_IN_TASKS : 0);
  const total = DOSE_SCHEDULE.length + DAILY_CHECK_IN_TASKS;
  return { done, total, ratio: done / total };
}

export type NextAction =
  | { kind: "red-flag" }
  | { kind: "take-dose"; doseId: string; time: string }
  | { kind: "check-in" }
  | { kind: "upcoming-dose"; doseId: string; time: string }
  | { kind: "register-dexa" }
  | { kind: "all-done" };

export interface NextActionInput {
  hasRedFlag: boolean;
  takenDoseIds: readonly string[];
  checkInDone: boolean;
  hasBoneScan: boolean;
  now: Date;
}

/** Una sola sugerencia, la más útil. La evaluación reumatológica va siempre primero. */
export function suggestNextAction({ hasRedFlag, takenDoseIds, checkInDone, hasBoneScan, now }: NextActionInput): NextAction {
  if (hasRedFlag) return { kind: "red-flag" };
  const taken = new Set(takenDoseIds);
  const pending = DOSE_SCHEDULE.filter((dose) => !taken.has(dose.id));
  const due = pending.find((dose) => doseSlotStatus(dose.time, false, now) === "due");
  if (due) return { kind: "take-dose", doseId: due.id, time: due.time };
  if (!checkInDone) return { kind: "check-in" };
  const [upcoming] = pending;
  if (upcoming) return { kind: "upcoming-dose", doseId: upcoming.id, time: upcoming.time };
  return hasBoneScan ? { kind: "all-done" } : { kind: "register-dexa" };
}
