"use client";

import { useEffect, useState } from "react";

const MINUTE_MS = 60_000;

/** "Ahora" que se refresca cada minuto: las franjas pasan de "Más tarde" a "Te toca ahora" sin recargar. */
export function useMinuteClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), MINUTE_MS);
    return () => clearInterval(timer);
  }, []);
  return now;
}
