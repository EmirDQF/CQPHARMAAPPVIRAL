import { Capacitor } from "@capacitor/core";
import { DOSE_SCHEDULE } from "../clinical/constants";
import { REMINDER_BODY, REMINDER_TITLE } from "../reminders/reminders";
import { millisecondsUntilNextLimaTime } from "../utils/date";

/**
 * Recordatorios de toma en la app nativa (Capacitor). El sistema operativo
 * los dispara aunque la app esté cerrada, a diferencia del setTimeout de la
 * PWA. Lima no tiene horario de verano: un instante fijo que se repite cada
 * 24 h cae siempre a las 08:30 y 21:30 de Lima, sin importar la zona del
 * celular. El texto es genérico: nunca nombra el suplemento (dato de salud
 * visible en la pantalla bloqueada).
 */

/** Ids fijos por toma: reprogramar reemplaza en vez de duplicar. */
const DOSE_NOTIFICATION_ID_BASE = 830;

export interface NativeDoseNotification {
  id: number;
  title: string;
  body: string;
  schedule: { at: Date; every: "day"; allowWhileIdle: true };
}

export type NativeReminderPermission = "granted" | "denied";

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export function buildNativeDoseNotifications(now: Date = new Date()): NativeDoseNotification[] {
  return DOSE_SCHEDULE.map((dose, index) => ({
    id: DOSE_NOTIFICATION_ID_BASE + index,
    title: REMINDER_TITLE,
    body: REMINDER_BODY,
    schedule: {
      at: new Date(now.getTime() + millisecondsUntilNextLimaTime(dose.time, now)),
      every: "day",
      allowWhileIdle: true,
    },
  }));
}

/** Pide permiso (solo tras un toque del paciente) y programa las tomas diarias. */
export async function enableNativeDoseReminders(now: Date = new Date()): Promise<NativeReminderPermission> {
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const { display } = await LocalNotifications.requestPermissions();
    if (display !== "granted") return "denied";

    const notifications = buildNativeDoseNotifications(now);
    await LocalNotifications.cancel({ notifications: notifications.map(({ id }) => ({ id })) });
    await LocalNotifications.schedule({ notifications });
    return "granted";
  } catch (error: unknown) {
    console.error("[reminders] No se pudieron programar los recordatorios nativos", error);
    return "denied";
  }
}
