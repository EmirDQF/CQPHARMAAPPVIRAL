"use client";

import { useEffect } from "react";
import { doseSchedule } from "@/lib/dashboard/mockData";
import { millisecondsUntilNextOccurrence } from "@/lib/dashboard/pillboxReminders";

/**
 * Simula recordatorios locales de toma (08:30 AM / 09:30 PM) usando la
 * Notification API del navegador + setTimeout recursivo, sin depender de un
 * servidor de push. Cada dosis se reprograma sola para el día siguiente.
 */
export function usePillboxReminders(): void {
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    const cancelFns = doseSchedule.map((dose) => {
      let timeoutId: ReturnType<typeof setTimeout>;

      function scheduleNext() {
        const delay = millisecondsUntilNextOccurrence(dose.time);
        timeoutId = setTimeout(() => {
          if (Notification.permission === "granted") {
            new Notification("Artikare • Hora de tu toma", {
              body: `${dose.label} — mantén tu racha de huesos protegidos.`,
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
