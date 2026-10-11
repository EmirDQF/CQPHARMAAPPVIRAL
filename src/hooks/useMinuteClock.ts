"use client";

import { useSyncExternalStore } from "react";

const MINUTE_MS = 60_000;

/** Primer aviso en el borde del minuto real y luego cada minuto: "Te toca ahora" aparece a la hora exacta. */
function subscribeEveryMinute(onTick: () => void): () => void {
  let interval: ReturnType<typeof setInterval> | undefined;
  const firstTick = setTimeout(() => {
    onTick();
    interval = setInterval(onTick, MINUTE_MS);
  }, MINUTE_MS - (Date.now() % MINUTE_MS));
  return () => {
    clearTimeout(firstTick);
    if (interval !== undefined) clearInterval(interval);
  };
}

const currentMinute = () => Math.floor(Date.now() / MINUTE_MS);
const noMinuteOnServer = () => null;

/**
 * "Ahora", refrescado en cada cambio de minuto. null en el servidor y al
 * hidratar: /app se prerenderiza en el build y esa hora no debe llegar al HTML.
 * `minute` solo dispara el re-render; el valor devuelto es la hora real.
 */
export function useMinuteClock(): Date | null {
  const minute = useSyncExternalStore(subscribeEveryMinute, currentMinute, noMinuteOnServer);
  return minute === null ? null : new Date();
}
