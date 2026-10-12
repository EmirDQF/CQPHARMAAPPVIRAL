"use client";

import { useEffect, useSyncExternalStore } from "react";
import { textSizeStore } from "@/lib/display/textSize";

/** Refleja el tamaño de letra elegido en `<html data-text-size>`; globals.css hace el resto. */
export function TextSizeApplier() {
  const { size } = useSyncExternalStore(textSizeStore.subscribe, textSizeStore.getSnapshot, textSizeStore.getServerSnapshot);
  useEffect(() => {
    document.documentElement.dataset.textSize = size;
  }, [size]);
  return null;
}
