"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { DOSE_SCHEDULE } from "@/lib/clinical/constants";
import { createListenerSet } from "@/lib/createListenerSet";
import { pillboxStore } from "@/lib/dashboard/pillbox";
import {
  REMINDER_BODY,
  REMINDER_TITLE,
  detectReminderSupport,
  hasTakenAnyDose,
  readReminderEnvironment,
  reminderPromptStore,
  shouldNotifyDose,
  shouldOfferReminders,
  snoozeReminderOffer,
  type ReminderSupport,
} from "@/lib/reminders/reminders";
import { enableNativeDoseReminders, isNativeApp } from "@/lib/native/doseNotifications";
import { millisecondsUntilNextLimaTime, toLimaIsoDate } from "@/lib/utils/date";

const NOTIFICATION_ICON = "/icons/icon-192x192.png";

/**
 * El navegador no avisa cuando cambia el permiso: se notifica a mano tras
 * pedirlo, así todas las instancias del hook leen el mismo valor.
 */
const supportListeners = createListenerSet();

/** En la app nativa el permiso vive en el sistema operativo; se recuerda el último resultado. */
let nativeSupport: ReminderSupport = "ask";

function getSupportSnapshot(): ReminderSupport {
  if (isNativeApp()) return nativeSupport;
  return detectReminderSupport(readReminderEnvironment());
}

function getServerSupportSnapshot(): null {
  return null;
}

export interface PillboxReminders {
  /** null hasta montar en el navegador (en el servidor no se sabe). */
  support: ReminderSupport | null;
  shouldOffer: boolean;
  /** Pide permiso; solo debe llamarse desde un toque del paciente. */
  requestPermission: () => Promise<void>;
  snooze: () => void;
}

/**
 * Chrome en Android no permite `new Notification()` en la página ("Illegal
 * constructor"): ahí hay que pasar por el service worker.
 */
async function showReminderNotification(tag: string): Promise<void> {
  const options: NotificationOptions = { body: REMINDER_BODY, icon: NOTIFICATION_ICON, tag };
  const registration = await navigator.serviceWorker?.getRegistration();
  if (registration) {
    await registration.showNotification(REMINDER_TITLE, options);
    return;
  }
  new Notification(REMINDER_TITLE, options);
}

function notifyIfPending(doseId: string, tag: string): void {
  if (Notification.permission !== "granted") return;
  if (!shouldNotifyDose(pillboxStore.getSnapshot(), doseId, toLimaIsoDate())) return;

  showReminderNotification(tag).catch((error: unknown) => {
    console.error("[reminders] No se pudo mostrar el recordatorio", error);
  });
}

/**
 * Recordatorios locales de toma (hora de Lima) con la Notification API y un
 * setTimeout que se reprograma cada día. Nunca pide permiso por su cuenta:
 * la oferta aparece después de la primera toma y el permiso se pide al tocar.
 */
export function usePillboxReminders(): PillboxReminders {
  const support = useSyncExternalStore(
    supportListeners.subscribe,
    getSupportSnapshot,
    getServerSupportSnapshot
  );
  const pillboxState = useSyncExternalStore(
    pillboxStore.subscribe,
    pillboxStore.getSnapshot,
    pillboxStore.getServerSnapshot
  );
  const promptState = useSyncExternalStore(
    reminderPromptStore.subscribe,
    reminderPromptStore.getSnapshot,
    reminderPromptStore.getServerSnapshot
  );

  const isGranted = support === "granted";

  useEffect(() => {
    // En nativo los programa el sistema operativo (doseNotifications.ts).
    if (!isGranted || isNativeApp()) return;

    const timeoutIds = new Map<string, ReturnType<typeof setTimeout>>();

    function scheduleNext(doseId: string, time: string, tag: string) {
      const timeoutId = setTimeout(() => {
        notifyIfPending(doseId, tag);
        scheduleNext(doseId, time, tag);
      }, millisecondsUntilNextLimaTime(time));
      timeoutIds.set(doseId, timeoutId);
    }

    DOSE_SCHEDULE.forEach((dose) => scheduleNext(dose.id, dose.time, `artikare-${dose.period}`));
    return () => timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId));
  }, [isGranted]);

  const requestPermission = useCallback(async () => {
    if (isNativeApp()) {
      nativeSupport = (await enableNativeDoseReminders()) === "granted" ? "granted" : "calendar";
    } else if ("Notification" in window) {
      try {
        await Notification.requestPermission();
      } catch (error: unknown) {
        console.error("[reminders] No se pudo solicitar permiso de notificaciones", error);
      }
    }
    supportListeners.notify();
  }, []);

  const shouldOffer =
    support !== null &&
    support !== "granted" &&
    shouldOfferReminders(promptState, toLimaIsoDate(), hasTakenAnyDose(pillboxState));

  return { support, shouldOffer, requestPermission, snooze: snoozeReminderOffer };
}
