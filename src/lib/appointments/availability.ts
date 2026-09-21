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
});

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
 * empezando mañana.
 */
export function buildAvailableDays(
  referenceDate: Date = new Date(),
  totalDays = 8
): AvailableDay[] {
  const days: AvailableDay[] = [];
  const cursor = new Date(referenceDate);
  cursor.setDate(cursor.getDate() + 1);

  while (days.length < totalDays) {
    if (cursor.getDay() !== 0) {
      const date = cursor.toISOString().slice(0, 10);
      days.push({
        date,
        label: DAY_LABEL_FORMATTER.format(cursor),
        slots: {
          manana: isSlotAvailable(date, "manana"),
          tarde: isSlotAvailable(date, "tarde"),
        },
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}
