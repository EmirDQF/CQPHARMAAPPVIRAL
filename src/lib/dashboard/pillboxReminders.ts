function parseTimeLabel(timeLabel: string): { hours: number; minutes: number } {
  const match = timeLabel.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
  if (!match) return { hours: 8, minutes: 0 };

  const rawHours = Number(match[1]) % 12;
  const minutes = Number(match[2]);
  const isPm = match[3].toUpperCase() === "PM";

  return { hours: isPm ? rawHours + 12 : rawHours, minutes };
}

/**
 * Calcula cuánto falta (en ms) para la próxima ocurrencia de un horario tipo
 * "08:30 AM", saltando al día siguiente si esa hora ya pasó hoy.
 */
export function millisecondsUntilNextOccurrence(
  timeLabel: string,
  referenceDate: Date = new Date()
): number {
  const { hours, minutes } = parseTimeLabel(timeLabel);
  const next = new Date(referenceDate);
  next.setHours(hours, minutes, 0, 0);

  if (next.getTime() <= referenceDate.getTime()) {
    next.setDate(next.getDate() + 1);
  }

  return next.getTime() - referenceDate.getTime();
}
