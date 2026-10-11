"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { UNDO_WINDOW_MS } from "@/lib/clinical/constants";
import { markDoseTaken } from "@/lib/dashboard/pillbox";

export interface DeferredDose {
  /** Tomas marcadas que aún se pueden deshacer. */
  pendingDoseIds: string[];
  take: (doseId: string) => void;
  undo: (doseId: string) => void;
}

/**
 * "Ya me la tomé" con deshacer. La toma se escribe en el pastillero recién al
 * cerrar la ventana de deshacer (o al ocultar/salir de la app): la
 * sincronización une tomas y nunca las borra, así que deshacer no puede
 * depender de borrar una toma ya escrita. Una franja cuenta una sola vez.
 */
export function useDeferredDose(): DeferredDose {
  const [pendingDoseIds, setPendingDoseIds] = useState<string[]>([]);
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const forget = useCallback((doseId: string) => {
    const timer = timersRef.current.get(doseId);
    if (timer !== undefined) clearTimeout(timer);
    timersRef.current.delete(doseId);
    setPendingDoseIds((current) => current.filter((id) => id !== doseId));
  }, []);

  const commit = useCallback(
    (doseId: string) => {
      forget(doseId);
      markDoseTaken(doseId);
    },
    [forget]
  );

  const take = useCallback(
    (doseId: string) => {
      if (timersRef.current.has(doseId)) return;
      timersRef.current.set(doseId, setTimeout(() => commit(doseId), UNDO_WINDOW_MS));
      setPendingDoseIds((current) => [...current, doseId]);
    },
    [commit]
  );

  useEffect(() => {
    const timers = timersRef.current;
    const flushAll = () => [...timers.keys()].forEach(commit);
    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") flushAll();
    };
    window.addEventListener("pagehide", flushAll);
    document.addEventListener("visibilitychange", flushWhenHidden);
    return () => {
      window.removeEventListener("pagehide", flushAll);
      document.removeEventListener("visibilitychange", flushWhenHidden);
      // Al desmontar no hay estado que actualizar: solo se escribe lo pendiente.
      timers.forEach((timer, doseId) => {
        clearTimeout(timer);
        markDoseTaken(doseId);
      });
      timers.clear();
    };
  }, [commit]);

  return { pendingDoseIds, take, undo: forget };
}
