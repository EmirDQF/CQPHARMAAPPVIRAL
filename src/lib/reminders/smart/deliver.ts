import { Capacitor } from "@capacitor/core";
import type { NudgeMessage } from "./messages";

/**
 * Muestra YA un aviso de contexto (la app quedó en segundo plano justo al
 * conectarse a Wi-Fi). En la app nativa usa @capacitor/local-notifications;
 * en la web, el service worker. Solo si el permiso ya está concedido: aquí
 * nunca se pide permiso.
 */
export const NUDGE_NOTIFICATION_ID = 940;
const IMMEDIATE_DELAY_MS = 1000;
const NOTIFICATION_ICON = "/icons/icon-192x192.png";

export interface DeliverDependencies {
  isNativeApp: () => boolean;
  showNative: (message: NudgeMessage, at: Date) => Promise<boolean>;
  showWeb: (message: NudgeMessage) => Promise<boolean>;
}

async function showNative(message: NudgeMessage, at: Date): Promise<boolean> {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  if ((await LocalNotifications.checkPermissions()).display !== "granted") return false;
  await LocalNotifications.schedule({
    notifications: [{ id: NUDGE_NOTIFICATION_ID, title: message.title, body: message.body, schedule: { at, allowWhileIdle: true } }],
  });
  return true;
}

async function showWeb(message: NudgeMessage): Promise<boolean> {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;
  const registration = await navigator.serviceWorker?.getRegistration();
  if (!registration) return false;
  await registration.showNotification(message.title, { body: message.body, icon: NOTIFICATION_ICON, tag: "artikare-nudge" });
  return true;
}

const DEFAULT_DEPENDENCIES: DeliverDependencies = { isNativeApp: () => Capacitor.isNativePlatform(), showNative, showWeb };

/** true si el aviso se mostró. Nunca lanza. */
export async function deliverNudge(message: NudgeMessage, now: Date = new Date(), deps: DeliverDependencies = DEFAULT_DEPENDENCIES): Promise<boolean> {
  try {
    return deps.isNativeApp() ? await deps.showNative(message, new Date(now.getTime() + IMMEDIATE_DELAY_MS)) : await deps.showWeb(message);
  } catch (error: unknown) {
    console.error("[reminders] No se pudo mostrar el aviso de Artiko", error);
    return false;
  }
}
