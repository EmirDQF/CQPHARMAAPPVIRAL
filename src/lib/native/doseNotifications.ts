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

/** Estado del permiso en el sistema operativo; "prompt" = el paciente aún no decidió. */
export type NativePermissionState = "granted" | "prompt" | "denied";

type LocalNotificationsPlugin = (typeof import("@capacitor/local-notifications"))["LocalNotifications"];

/**
 * El plugin se devuelve envuelto: es un proxy de Capacitor y, si una función
 * async lo devolviera tal cual, el await lo trataría como thenable y llamaría
 * a `LocalNotifications.then()`, que en Android no existe (no se programaba nada).
 */
async function loadPlugin(): Promise<{ plugin: LocalNotificationsPlugin }> {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  return { plugin: LocalNotifications };
}

/** Mismos ids en cada pase: cancelar y volver a programar es idempotente. */
async function scheduleDailyDoses(plugin: LocalNotificationsPlugin, now: Date): Promise<void> {
  const notifications = buildNativeDoseNotifications(now);
  await plugin.cancel({ notifications: notifications.map(({ id }) => ({ id })) });
  await plugin.schedule({ notifications });
}

function toPermissionState(display: string): NativePermissionState {
  if (display === "granted") return "granted";
  return display === "denied" ? "denied" : "prompt";
}

/** Pide permiso (solo tras un toque del paciente) y programa las tomas diarias. */
export async function enableNativeDoseReminders(now: Date = new Date()): Promise<NativeReminderPermission> {
  try {
    const { plugin } = await loadPlugin();
    const { display } = await plugin.requestPermissions();
    if (display !== "granted") return "denied";

    await scheduleDailyDoses(plugin, now);
    return "granted";
  } catch (error: unknown) {
    console.error("[reminders] No se pudieron programar los recordatorios nativos", error);
    return "denied";
  }
}

/**
 * Al abrir la app: lee el permiso real sin pedirlo y, si está concedido,
 * reprograma (cubre reinicios del celular y cambios de horario del plan).
 * Ante un fallo responde "prompt": mejor volver a ofrecer que callar.
 */
export async function syncNativeDoseReminders(now: Date = new Date()): Promise<NativePermissionState> {
  try {
    const { plugin } = await loadPlugin();
    const state = toPermissionState((await plugin.checkPermissions()).display);
    if (state === "granted") await scheduleDailyDoses(plugin, now);
    return state;
  } catch (error: unknown) {
    console.error("[reminders] No se pudo leer el permiso de recordatorios nativos", error);
    return "prompt";
  }
}
