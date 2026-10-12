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
