"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { setThemeMode, themeStore } from "@/lib/display/theme";

/** Botón sol/luna: claro por defecto; un toque cambia a oscuro y otro vuelve a claro. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { mode } = useSyncExternalStore(themeStore.subscribe, themeStore.getSnapshot, themeStore.getServerSnapshot);
  const isDark = mode === "dark";
  const Icon = isDark ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={() => setThemeMode(isDark ? "light" : "dark")}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-pressed={isDark}
      className={`min-h-12 min-w-12 flex items-center justify-center rounded-full bg-pastel-lemon text-pastel-lemon-ink border-2 border-pastel-lemon-edge transition-transform active:scale-95 ${className}`}
    >
      <Icon aria-hidden="true" className="size-5" />
    </button>
  );
}
