"use client";

import { useEffect } from "react";
import { DOSE_SCHEDULE } from "@/lib/clinical/constants";
import { millisecondsUntilNextLimaTime } from "@/lib/utils/date";

/**
 * Recordatorios locales de toma (hora de Lima) usando la Notification API
 * del navegador + setTimeout recursivo, sin servidor de push. Cada dosis se
 * reprograma sola para el día siguiente.
 */
export function usePillboxReminders(): void {
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "default") {
      Notification.requestPermission().catch((error: unknown) => {
        console.error("[pillbox] No se pudo solicitar permiso de notificaciones", error);
      });
    }

    const cancelFns = DOSE_SCHEDULE.map((dose) => {
      let timeoutId: ReturnType<typeof setTimeout>;

      function scheduleNext() {
        const delay = millisecondsUntilNextLimaTime(dose.time);
        timeoutId = setTimeout(() => {
          if (Notification.permission === "granted") {
            new Notification("Artikare • Hora de tu toma", {
              body: `${dose.label} — mantén tu racha.`,
              icon: "/icons/icon-192x192.png",
            });
          }
          scheduleNext();
        }, delay);
      }

      scheduleNext();
      return () => clearTimeout(timeoutId);
    });

    return () => cancelFns.forEach((cancel) => cancel());
  }, []);
}
