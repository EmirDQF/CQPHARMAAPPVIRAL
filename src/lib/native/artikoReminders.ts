import { Capacitor, registerPlugin } from "@capacitor/core";
import { NUDGE_MESSAGES, NUDGE_SLOTS, PAUSE_MESSAGE, fillStreak, type NudgeSlot } from "../reminders/smart/messages";
import { PAUSE_AFTER_DAYS, QUIET_END, QUIET_START, nudgesAllowedPerDay } from "../reminders/smart/policy";
import type { SmartRemindersSettings } from "../reminders/smart/settings";

/**
 * Puente al plugin nativo mínimo `ArtikoReminders` (Android, WorkManager):
 * cada 15 min, solo con red sin tarifa (Wi-Fi) y solo si quedan misiones,
 * muestra un aviso genérico. El plugin replica `decideNudge`; aquí se le
 * entregan el estado del día y los textos ya listos (nunca datos de salud).
 * En la web y en iOS no hace nada.
 */
export interface NativeNudgeState {
  enabled: boolean;
  /** Fecha de Lima del estado (si cambia el día, todas las misiones cuentan como pendientes). */
  date: string;
  pendingMissions: number;
  lastOpenedOn: string | null;
  silencedOn: string | null;
  maxPerDay: number;
  /** Franjas ya usadas hoy por avisos enviados desde la app. */
  sentSlotsToday: string[];
  quietStartMinutes: number;
  quietEndMinutes: number;
  pauseAfterDays: number;
  title: string;
  messages: Record<NudgeSlot, string[]>;
  pauseMessage: string;
}

export interface ArtikoRemindersPlugin {
  configure(state: NativeNudgeState): Promise<void>;
  /** Avisos que mostró el trabajo nativo (para respetar topes al volver a la app). */
  getSent(): Promise<{ sent: { date: string; slot: string }[] }>;
}

const ArtikoReminders = registerPlugin<ArtikoRemindersPlugin>("ArtikoReminders");

export interface NudgeStateInput {
  settings: SmartRemindersSettings;
  today: string;
  pendingMissions: number;
  lastOpenedOn: string | null;
  streakDays: number;
  doseRemindersPerDay: number;
}

export function buildNativeNudgeState(input: NudgeStateInput): NativeNudgeState {
  const { settings, today } = input;
  const messages = Object.fromEntries(
    NUDGE_SLOTS.map((slot) => [slot, NUDGE_MESSAGES[slot].map((message) => fillStreak(message.body, input.streakDays))])
  ) as Record<NudgeSlot, string[]>;
  return {
    enabled: settings.wifiNudges,
    date: today,
    pendingMissions: input.pendingMissions,
    lastOpenedOn: input.lastOpenedOn,
    silencedOn: settings.silencedOn,
    maxPerDay: nudgesAllowedPerDay(input.doseRemindersPerDay),
    sentSlotsToday: settings.sent.filter((entry) => entry.date === today).map((entry) => entry.slot),
    quietStartMinutes: QUIET_START,
    quietEndMinutes: QUIET_END,
    pauseAfterDays: PAUSE_AFTER_DAYS,
    title: PAUSE_MESSAGE.title,
    messages,
    pauseMessage: PAUSE_MESSAGE.body,
  };
}

export function supportsBackgroundWifiNudges(): boolean {
  return Capacitor.getPlatform() === "android";
}

/** Envía el estado al trabajo nativo; idempotente (reemplaza el trabajo único). Nunca lanza. */
export async function syncNativeNudgeState(state: NativeNudgeState, plugin: ArtikoRemindersPlugin = ArtikoReminders): Promise<boolean> {
  if (!supportsBackgroundWifiNudges()) return false;
  try {
    await plugin.configure(state);
    return true;
  } catch (error: unknown) {
    console.error("[reminders] No se pudo actualizar el aviso por Wi-Fi en segundo plano", error);
    return false;
  }
}

export async function readNativeSentNudges(plugin: ArtikoRemindersPlugin = ArtikoReminders): Promise<{ date: string; slot: string }[]> {
  if (!supportsBackgroundWifiNudges()) return [];
  try {
    return (await plugin.getSent()).sent;
  } catch {
    return [];
  }
}
