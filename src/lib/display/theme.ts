import { z } from "zod";
import { createPersistentStore } from "../storage/persistentStore";

/**
 * Tema de la app (local, sin datos de salud). Claro por defecto, para todos:
 * no sigue al modo oscuro del sistema. Solo cambia si la persona toca el botón
 * sol/luna. globals.css pinta el oscuro con `html[data-theme="dark"]`.
 */
export const THEME_VERSION = 1;
export const THEME_STORAGE_KEY = "artikare_theme_v1";
export const THEMES_AVAILABLE = ["light", "dark"] as const;
export type ThemeMode = (typeof THEMES_AVAILABLE)[number];

/** Color de la barra del navegador y del sistema para cada tema (lienzo de tokens.ts). */
export const THEME_BAR_COLOR: Record<ThemeMode, string> = { light: "#FBF8F3", dark: "#141A22" };

const themeSchema = z.object({
  version: z.literal(THEME_VERSION),
  mode: z.enum(THEMES_AVAILABLE).catch("light"),
});

export type ThemePreference = z.infer<typeof themeSchema>;

export const DEFAULT_THEME: ThemePreference = { version: THEME_VERSION, mode: "light" };

/** null = versión desconocida: el store no la sobrescribe. */
export function parseTheme(raw: unknown): ThemePreference | null {
  const parsed = themeSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export const themeStore = createPersistentStore<ThemePreference>(THEME_STORAGE_KEY, DEFAULT_THEME, parseTheme);

export function setThemeMode(mode: ThemeMode): void {
  themeStore.write({ version: THEME_VERSION, mode });
}

/**
 * Script en línea para `<head>`: pone `<html data-theme="dark">` antes de la
 * primera pintura si se eligió oscuro (sin parpadeo blanco). Cadena fija
 * generada desde constantes, sin datos del usuario. Nunca lanza.
 */
export const THEME_BOOT_SCRIPT = `try{var t=JSON.parse(localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)})||"null");if(t&&t.version===${THEME_VERSION}&&t.mode==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;
