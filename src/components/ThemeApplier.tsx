"use client";

import { useEffect } from "react";
import { THEME_BAR_COLOR, themeStore } from "@/lib/display/theme";

/** Mantiene `<html data-theme>` y el color de la barra del sistema al día con la preferencia. */
export function ThemeApplier() {
  useEffect(() => {
    const apply = () => {
      const { mode } = themeStore.getSnapshot();
      if (mode === "dark") document.documentElement.dataset.theme = "dark";
      else delete document.documentElement.dataset.theme;
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_BAR_COLOR[mode]);
    };
    apply();
    return themeStore.subscribe(apply);
  }, []);
  return null;
}
