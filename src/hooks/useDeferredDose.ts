"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { markDoseTaken } from "@/lib/dashboard/pillbox";
import { toLimaIsoDate } from "@/lib/utils/date";
import { playSound } from "@/lib/feedback/sounds";

export interface DeferredDose {
  /** Tomas anotadas que aún se pueden deshacer. */
  pendingDoseIds: string[];
  /** Última toma guardada con "Listo" (para anunciarla con aria-live). */
  lastConfirmedDoseId: string | null;
  take: (doseId: string) => void;
  undo: (doseId: string) => void;
  confirm: (doseId: string) => void;
}

/**
 * "Ya me la tomé" con deshacer, sin límite de tiempo (WCAG 2.2.1): la toma
 * queda anotada hasta que el paciente pulsa "Listo" o sale/oculta la app. Se
 * guarda recién entonces porque la sincronización une tomas y nunca las borra,
 * y con el día de Lima del TOQUE (una toma de las 23:59 no pasa al día
 * siguiente). Una franja cuenta una sola vez. Vive en AppShell: cambiar de
 * pestaña no la confirma.
 */
export function useDeferredDose(): DeferredDose {
  const [pendingDoseIds, setPendingDoseIds] = useState<string[]>([]);
  const [lastConfirmedDoseId, setLastConfirmedDoseId] = useState<string | null>(null);
  const tappedOnRef = useRef(new Map<string, string>());

  const forget = useCallback((doseId: string) => {
    tappedOnRef.current.delete(doseId);
    setPendingDoseIds((current) => current.filter((id) => id !== doseId));
  }, []);

  const confirm = useCallback(
    (doseId: string) => {
      const tappedOn = tappedOnRef.current.get(doseId);
      if (tappedOn === undefined) return;
      forget(doseId);
      markDoseTaken(doseId, tappedOn);
      setLastConfirmedDoseId(doseId);
    },
    [forget]
  );

  const take = useCallback((doseId: string) => {
    if (tappedOnRef.current.has(doseId)) return;
    tappedOnRef.current.set(doseId, toLimaIsoDate());
    playSound("success");
    setLastConfirmedDoseId(null);
    setPendingDoseIds((current) => [...current, doseId]);
  }, []);

  useEffect(() => {
    const tappedOn = tappedOnRef.current;
    const flushAll = () => [...tappedOn.keys()].forEach(confirm);
    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") flushAll();
    };
    window.addEventListener("pagehide", flushAll);
    document.addEventListener("visibilitychange", flushWhenHidden);
    return () => {
      window.removeEventListener("pagehide", flushAll);
      document.removeEventListener("visibilitychange", flushWhenHidden);
      // Al salir del panel no hay estado que actualizar: solo se guarda lo anotado.
      tappedOn.forEach((date, doseId) => markDoseTaken(doseId, date));
      tappedOn.clear();
    };
  }, [confirm]);

  const undo = useCallback(
    (doseId: string) => {
      playSound("gentle");
      forget(doseId);
    },
    [forget]
  );

  return { pendingDoseIds, lastConfirmedDoseId, take, undo, confirm };
}
