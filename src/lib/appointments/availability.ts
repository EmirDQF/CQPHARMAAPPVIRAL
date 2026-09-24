import { addDaysToIsoDate, toLimaIsoDate } from "../utils/date";
import type { AppointmentSlot } from "./types";

export interface AvailableDay {
  date: string;
  label: string;
  slots: Record<AppointmentSlot, boolean>;
}

const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat("es-PE", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const SUNDAY = 0;

function isoDateToUtcNoon(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00Z`);
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function isSlotAvailable(dateIso: string, slot: AppointmentSlot): boolean {
  return hashString(`${dateIso}-${slot}`) % 5 !== 0;
}

/**
 * Genera disponibilidad simulada pero determinista (sin sábados/domingos
 * fuera de horario ni Math.random) para los próximos `totalDays` hábiles,
 * empezando mañana (hora de Lima).
 */
export function buildAvailableDays(
  referenceDate: Date = new Date(),
  totalDays = 8
): AvailableDay[] {
  const days: AvailableDay[] = [];
  let date = addDaysToIsoDate(toLimaIsoDate(referenceDate), 1);

  while (days.length < totalDays) {
    const calendarDay = isoDateToUtcNoon(date);
    if (calendarDay.getUTCDay() !== SUNDAY) {
      days.push({
        date,
        label: DAY_LABEL_FORMATTER.format(calendarDay),
        slots: {
          manana: isSlotAvailable(date, "manana"),
          tarde: isSlotAvailable(date, "tarde"),
        },
      });
    }
    date = addDaysToIsoDate(date, 1);
  }

  return days;
}
