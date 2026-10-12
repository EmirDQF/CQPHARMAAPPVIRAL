"use client";

import { useEffect } from "react";
import { textSizeStore } from "@/lib/display/textSize";

/**
 * Mantiene `<html data-text-size>` al día cuando cambia la preferencia; globals.css hace el resto.
 * Lee el store directamente (no el snapshot de servidor de la hidratación) para no pisar
 * el valor que ya puso TEXT_SIZE_BOOT_SCRIPT antes de la primera pintura.
 */
export function TextSizeApplier() {
  useEffect(() => {
    const apply = () => {
      document.documentElement.dataset.textSize = textSizeStore.getSnapshot().size;
    };
    apply();
    return textSizeStore.subscribe(apply);
  }, []);
  return null;
}
