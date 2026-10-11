"use client";

import { useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

/** false en el HTML del servidor y en la hidratación; true después. Evita pintar "0 días" antes de leer el celular. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
}
