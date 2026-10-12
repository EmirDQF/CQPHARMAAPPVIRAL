"use client";

import { useEffect, useState } from "react";

/** Tiempo continuo con la app en pantalla antes de proponer una pausa. */
export const ACTIVE_BREAK_AFTER_MS = 10 * 60_000;
const CHECK_EVERY_MS = 15_000;

/**
 * Pausa activa DENTRO de la app: cuenta solo el tiempo seguido con la
 * pantalla visible (salir de la app reinicia la cuenta). No lee otras apps ni
 * guarda nada. `reset` vuelve a empezar tras aceptar o rechazar la pausa.
 */
export function useActiveBreak(enabled: boolean): { isDue: boolean; reset: () => void } {
  const [visibleSince, setVisibleSince] = useState(() => Date.now());
  const [isDue, setIsDue] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const onVisibility = () => {
      if (document.visibilityState === "visible") setVisibleSince(Date.now());
    };
    document.addEventListener("visibilitychange", onVisibility);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - visibleSince >= ACTIVE_BREAK_AFTER_MS) setIsDue(true);
    }, CHECK_EVERY_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(timer);
    };
  }, [enabled, visibleSince]);

  return {
    isDue: enabled && isDue,
    reset: () => {
      setIsDue(false);
      setVisibleSince(Date.now());
    },
  };
}
