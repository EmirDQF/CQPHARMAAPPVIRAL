import { CLINIC_TIME_ZONE } from "../clinical/constants";

const MINUTES_PER_DAY = 24 * 60;
const MS_PER_MINUTE = 60_000;

const limaDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CLINIC_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const displayTimeFormatter = new Intl.DateTimeFormat("es-PE", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "UTC",
});

interface LimaWallClock {
  isoDate: string;
  minutesOfDay: number;
  msIntoMinute: number;
}

function readLimaWallClock(date: Date): LimaWallClock {
  const parts = Object.fromEntries(
    limaDateTimeFormatter.formatToParts(date).map((part) => [part.type, part.value])
  );
  return {
    isoDate: `${parts.year}-${parts.month}-${parts.day}`,
    minutesOfDay: Number(parts.hour) * 60 + Number(parts.minute),
    msIntoMinute: Number(parts.second) * 1000 + date.getMilliseconds(),
  };
}

/**
 * Fecha calendario (YYYY-MM-DD) en hora de Lima. Reemplaza a
 * `toISOString().slice(0, 10)`, que usa UTC y en Perú (UTC-5) guarda las
 * tomas nocturnas con la fecha del día siguiente.
 */
export function toLimaIsoDate(date: Date = new Date()): string {
  return readLimaWallClock(date).isoDate;
}

/** Suma (o resta) días a una fecha YYYY-MM-DD sin depender de la zona horaria. */
export function addDaysToIsoDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** Las últimas `count` fechas de Lima terminando hoy, de la más reciente a la más antigua. */
export function lastNIsoDates(count: number, referenceDate: Date = new Date()): string[] {
  const today = toLimaIsoDate(referenceDate);
  return Array.from({ length: count }, (_, index) => addDaysToIsoDate(today, -index));
}

/**
 * Milisegundos hasta la próxima ocurrencia de una hora "HH:mm" de Lima; si
 * esa hora ya pasó (o es exactamente ahora), apunta al día siguiente.
 */
export function millisecondsUntilNextLimaTime(
  time24h: string,
  referenceDate: Date = new Date()
): number {
  const [hours, minutes] = time24h.split(":").map(Number);
  const now = readLimaWallClock(referenceDate);

  let minutesAhead = hours * 60 + minutes - now.minutesOfDay;
  if (minutesAhead <= 0) minutesAhead += MINUTES_PER_DAY;

  return minutesAhead * MS_PER_MINUTE - now.msIntoMinute;
}

/** Formatea "21:30" como hora legible en español ("9:30 p. m."). */
export function formatTime24hForDisplay(time24h: string): string {
  const [hours, minutes] = time24h.split(":").map(Number);
  return displayTimeFormatter.format(new Date(Date.UTC(2000, 0, 1, hours, minutes)));
}
