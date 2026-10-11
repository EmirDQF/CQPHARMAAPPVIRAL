import { DOSE_SCHEDULE, REMINDER_PROMPT_SNOOZE_DAYS } from "../clinical/constants";
import type { PillboxState } from "../dashboard/types";
import { createPersistentStore } from "../storage/persistentStore";
import { addDaysToIsoDate, toLimaIsoDate } from "../utils/date";

/**
 * Texto único de los recordatorios (notificación y calendario). Es neutro a
 * propósito: aparece en la pantalla bloqueada y en calendarios compartidos,
 * así que nunca lleva productos, valores clínicos ni la racha.
 */
// Genérico a propósito: en la pantalla bloqueada no revela que la persona toma suplementos.
export const REMINDER_TITLE = "Recordatorio de Artikare";
export const REMINDER_BODY = "Abre Artikare para registrar tu toma.";

const LIMA_TIME_ZONE = "America/Lima";
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const IOS_USER_AGENT_PATTERN = /iPhone|iPad|iPod/i;

export type ReminderPermission = NotificationPermission | "unsupported";

/**
 * - ask: se puede pedir permiso de notificaciones.
 * - ios-install: Safari en iOS solo notifica desde la app instalada.
 * - calendar: sin notificaciones posibles; se ofrece el archivo de calendario.
 * - granted: ya concedido, no hay nada que ofrecer.
 */
export type ReminderSupport = "ask" | "ios-install" | "calendar" | "granted";

export interface ReminderEnvironment {
  userAgent: string;
  permission: ReminderPermission;
  isStandalone: boolean;
}

export function detectReminderSupport({
  userAgent,
  permission,
  isStandalone,
}: ReminderEnvironment): ReminderSupport {
  if (permission === "granted") return "granted";
  if (permission === "default") return "ask";
  if (IOS_USER_AGENT_PATTERN.test(userAgent) && !isStandalone) return "ios-install";
  return "calendar";
}

/** Lee el entorno real del navegador; en el servidor no hay notificaciones. */
export function readReminderEnvironment(): ReminderEnvironment {
  if (typeof window === "undefined") {
    return { userAgent: "", permission: "unsupported", isStandalone: false };
  }
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  const isStandalone =
    navigatorWithStandalone.standalone === true ||
    (typeof window.matchMedia === "function" &&
      window.matchMedia("(display-mode: standalone)").matches);

  return {
    userAgent: window.navigator.userAgent,
    permission: "Notification" in window ? Notification.permission : "unsupported",
    isStandalone,
  };
}

export interface ReminderPromptState {
  /** Fecha de Lima (YYYY-MM-DD) desde la que se vuelve a ofrecer, o null. */
  snoozedUntil: string | null;
}

function parseReminderPromptState(raw: unknown): ReminderPromptState | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { snoozedUntil } = raw as Record<string, unknown>;
  if (snoozedUntil === null) return { snoozedUntil: null };
  if (typeof snoozedUntil === "string" && ISO_DATE_PATTERN.test(snoozedUntil)) {
    return { snoozedUntil };
  }
  return null;
}

export const reminderPromptStore = createPersistentStore<ReminderPromptState>(
  "artikare_reminder_prompt_v1",
  { snoozedUntil: null },
  parseReminderPromptState
);

export function snoozeReminderOffer(today: string = toLimaIsoDate()): void {
  reminderPromptStore.write({ snoozedUntil: addDaysToIsoDate(today, REMINDER_PROMPT_SNOOZE_DAYS) });
}

/**
 * La oferta aparece recién después de la primera toma registrada (el paciente
 * ya entiende para qué sirve) y respeta el "Ahora no".
 */
export function shouldOfferReminders(
  state: ReminderPromptState,
  today: string,
  hasTakenFirstDose: boolean
): boolean {
  if (!hasTakenFirstDose) return false;
  return state.snoozedUntil === null || today >= state.snoozedUntil;
}

export function hasTakenAnyDose(state: PillboxState): boolean {
  return Object.values(state.takenDoseIdsByDate).some((doseIds) => doseIds.length > 0);
}

export function shouldNotifyDose(state: PillboxState, doseId: string, date: string): boolean {
  return !(state.takenDoseIdsByDate[date] ?? []).includes(doseId);
}

function toIcsDate(isoDate: string): string {
  return isoDate.replace(/-/g, "");
}

function toIcsUtcTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function toIcsTime(time24h: string): string {
  return `${time24h.replace(":", "")}00`;
}

/**
 * Calendario (RFC 5545) con un evento diario por toma, en hora de Lima. Lima
 * no tiene horario de verano, así que basta un VTIMEZONE fijo en -05:00.
 */
export function buildRemindersIcs(
  startDate: string = toLimaIsoDate(),
  generatedAt: Date = new Date()
): string {
  const stamp = toIcsUtcTimestamp(generatedAt);
  const events = DOSE_SCHEDULE.flatMap((dose) => [
    "BEGIN:VEVENT",
    `UID:artikare-reminder-${dose.period}@artikare.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${LIMA_TIME_ZONE}:${toIcsDate(startDate)}T${toIcsTime(dose.time)}`,
    "DURATION:PT5M",
    "RRULE:FREQ=DAILY",
    `SUMMARY:${REMINDER_TITLE}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:PT0M",
    `DESCRIPTION:${REMINDER_TITLE}`,
    "END:VALARM",
    "END:VEVENT",
  ]);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Artikare//Recordatorios//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VTIMEZONE",
    `TZID:${LIMA_TIME_ZONE}`,
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:-0500",
    "TZOFFSETTO:-0500",
    "TZNAME:-05",
    "END:STANDARD",
    "END:VTIMEZONE",
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
