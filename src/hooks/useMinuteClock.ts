"use client";

import { useSyncExternalStore } from "react";

const MINUTE_MS = 60_000;

function subscribeEveryMinute(onTick: () => void): () => void {
  const timer = setInterval(onTick, MINUTE_MS);
  return () => clearInterval(timer);
}

const currentMinute = () => Math.floor(Date.now() / MINUTE_MS);
const noMinuteOnServer = () => null;

/**
 * "Ahora", refrescado cada minuto (las franjas pasan de "Más tarde" a "Te toca
 * ahora" sin recargar). null en el servidor y al hidratar: /app se prerenderiza
 * en el build y la hora de ese momento no debe llegar al HTML.
 */
export function useMinuteClock(): Date | null {
  const minute = useSyncExternalStore(subscribeEveryMinute, currentMinute, noMinuteOnServer);
  return minute === null ? null : new Date();
}
