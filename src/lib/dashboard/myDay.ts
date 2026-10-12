import { CLINIC_TIME_ZONE } from "../clinical/constants";
import { limaMinutesOfDay, time24hToMinutes } from "../utils/date";

/** Saludo, fecha y estado de cada toma en "Hoy" (/app). Todo en hora de Lima. */
const MORNING_START = time24hToMinutes("05:00");
const AFTERNOON_START = time24hToMinutes("12:00");
const NIGHT_START = time24hToMinutes("19:00");

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

export interface NextDoseHint {
  doseId: string;
  /** Minutos hasta la toma pendiente más próxima del día (Lima). */
  minutesUntil: number;
}

/** Primera toma del día aún no tomada y todavía por llegar; null si todas pasaron o ya se tomaron. */
export function nextUpcomingDose(
  schedule: readonly { id: string; time: string }[],
  takenDoseIds: readonly string[],
  now: Date = new Date()
): NextDoseHint | null {
  const current = limaMinutesOfDay(now);
  const upcoming = schedule
    .filter((dose) => !takenDoseIds.includes(dose.id) && time24hToMinutes(dose.time) > current)
    .map((dose) => ({ doseId: dose.id, minutesUntil: time24hToMinutes(dose.time) - current }))
    .sort((a, b) => a.minutesUntil - b.minutesUntil);
  return upcoming[0] ?? null;
}

/** "en 25 min", "en 3 h" o "en 2 h 15 min". */
export function formatMinutesUntil(minutes: number): string {
  if (minutes < 60) return `en ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `en ${hours} h` : `en ${hours} h ${rest} min`;
}
