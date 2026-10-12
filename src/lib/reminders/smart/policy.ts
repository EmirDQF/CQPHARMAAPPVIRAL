import { DOSE_SCHEDULE, MAX_DAILY_NOTIFICATIONS } from "../../clinical/constants";
import { addDaysToIsoDate, limaMinutesOfDay, time24hToMinutes } from "../../utils/date";
import { PAUSE_MESSAGE, pickNudgeMessage, type NudgeMessage, type NudgeSlot } from "./messages";
import type { SmartRemindersSettings } from "./settings";

/**
 * ¿Se envía un aviso de contexto ahora? Reglas sin culpa ni insistencia:
 * - Solo si la persona activó ese disparador y no tocó "Silenciar hoy".
 * - Horas de silencio 22:00–07:00 (las tomas de 08:30 y 21:30 van aparte).
 * - Máximo `MAX_DAILY_NOTIFICATIONS` avisos al día contando las tomas, y 1 por franja.
 * - Nunca si el día ya está completo (no quedan misiones).
 * - Tras 3 días sin abrir: un único "Aquí estaré cuando quieras volver" y silencio.
 * El trabajo nativo de Android (WifiNudgeWorker) replica estas reglas: ver docs/MOBILE.md.
 */
export const QUIET_START = time24hToMinutes("22:00");
export const QUIET_END = time24hToMinutes("07:00");
export const PAUSE_AFTER_DAYS = 3;
const AFTERNOON_START = time24hToMinutes("12:00");
const EVENING_START = time24hToMinutes("18:00");

export type NudgeTrigger = "wifi";

export interface NudgeContext {
  now: Date;
  today: string;
  settings: SmartRemindersSettings;
  /** Misiones del día aún pendientes. */
  pendingMissions: number;
  lastOpenedOn: string | null;
  streakDays: number;
  /** Recordatorios de toma programados por día (si están activos). */
  doseRemindersPerDay: number;
}

export type NudgeDecision =
  | { send: true; slot: NudgeSlot | "pause"; message: NudgeMessage }
  | { send: false; reason: "disabled" | "silenced" | "quiet-hours" | "daily-cap" | "slot-used" | "day-complete" | "paused" };

export function isQuietTime(now: Date): boolean {
  const minutes = limaMinutesOfDay(now);
  return minutes >= QUIET_START || minutes < QUIET_END;
}

export function slotOf(now: Date): NudgeSlot {
  const minutes = limaMinutesOfDay(now);
  if (minutes >= EVENING_START) return "evening";
  return minutes >= AFTERNOON_START ? "afternoon" : "morning";
}

/** Tope de avisos de contexto por día: lo que dejan libre las tomas. */
export function nudgesAllowedPerDay(doseRemindersPerDay: number): number {
  return Math.max(0, MAX_DAILY_NOTIFICATIONS - doseRemindersPerDay);
}

export const DOSE_REMINDERS_PER_DAY = DOSE_SCHEDULE.length;

function pausedDecision(context: NudgeContext): NudgeDecision {
  const { settings, lastOpenedOn } = context;
  const alreadySaidGoodbye = settings.sent.some((entry) => entry.slot === "pause" && lastOpenedOn !== null && entry.date > lastOpenedOn);
  return alreadySaidGoodbye ? { send: false, reason: "paused" } : { send: true, slot: "pause", message: PAUSE_MESSAGE };
}

export function decideNudge(trigger: NudgeTrigger, context: NudgeContext): NudgeDecision {
  const { settings, today, now } = context;
  if (trigger === "wifi" && !settings.wifiNudges) return { send: false, reason: "disabled" };
  if (settings.silencedOn === today) return { send: false, reason: "silenced" };
  if (isQuietTime(now)) return { send: false, reason: "quiet-hours" };
  const sentToday = settings.sent.filter((entry) => entry.date === today);
  if (sentToday.length >= nudgesAllowedPerDay(context.doseRemindersPerDay)) return { send: false, reason: "daily-cap" };
  const isPaused = context.lastOpenedOn !== null && context.lastOpenedOn <= addDaysToIsoDate(today, -PAUSE_AFTER_DAYS);
  if (isPaused) return pausedDecision(context);
  if (context.pendingMissions === 0) return { send: false, reason: "day-complete" };
  const slot = slotOf(now);
  if (sentToday.some((entry) => entry.slot === slot)) return { send: false, reason: "slot-used" };
  return { send: true, slot, message: pickNudgeMessage(slot, today, context.streakDays) };
}
