"use client";

import { useEffect } from "react";
import { flushOutbox, purgeExpiredDeadLetters } from "@/lib/api/outbox";
import { installAppointmentCodeSync } from "@/lib/api/registerAppointment";

/** Cada cuánto se revisa si hay entradas cuyo backoff ya venció. */
export const OUTBOX_POLL_INTERVAL_MS = 30_000;

/**
 * Vacía la cola de envíos pendientes al abrir la app, de forma periódica (para
 * los reintentos con backoff), al volver a la pestaña y al recuperar conexión.
 */
export function OutboxSync() {
  useEffect(() => {
    const flush = () => void flushOutbox();
    // La conexión volvió: no tiene sentido esperar el backoff acumulado offline.
    const flushNow = () => void flushOutbox({ ignoreBackoff: true });
    const flushWhenVisible = () => {
      if (document.visibilityState === "visible") flush();
    };

    // Si la base asignó otro código de cita (colisión), la cita local lo adopta.
    const uninstallAppointmentCodeSync = installAppointmentCodeSync();
    purgeExpiredDeadLetters();
    flush();
    const intervalId = window.setInterval(flush, OUTBOX_POLL_INTERVAL_MS);
    window.addEventListener("online", flushNow);
    document.addEventListener("visibilitychange", flushWhenVisible);
    return () => {
      uninstallAppointmentCodeSync();
      window.clearInterval(intervalId);
      window.removeEventListener("online", flushNow);
      document.removeEventListener("visibilitychange", flushWhenVisible);
    };
  }, []);

  return null;
}
