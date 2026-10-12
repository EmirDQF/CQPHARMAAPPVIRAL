/**
 * Sistema de diseño "Clínico amable" (V1). Fuente de verdad de los colores:
 * src/app/globals.css declara exactamente estos valores (lo verifica
 * contrast.test.ts) y los componentes solo usan las utilidades de Tailwind que
 * salen de ellos (bg-pastel-mint, text-clinic, …), nunca hex sueltos.
 *
 * Reglas de uso (docs/DESIGN.md):
 * - Pasteles = fondos de tarjetas, gráficas e insignias, siempre con su tinta.
 * - `action` (teal claro) solo como relleno detrás de `action-ink`; botones
 *   con texto blanco, `action-strong`; anillos y barras de gráficas, `progress`.
 * - Los colores del semáforo OMS y de la bandera roja (`--color-risk-*`) NO
 *   pertenecen a esta capa y no se pastelizan.
 */
export const THEMES = {
  light: {
    "color-canvas": "#F8FAFC",
    "color-surface": "#FFFFFF",
    "color-ink": "#0F172A",
    "color-muted": "#64748B",
    "color-line": "#E2E8F0",
    "color-clinic": "#0F4C81",
    "color-action": "#14B8A6",
    "color-action-ink": "#042F2E",
    "color-action-strong": "#0F766E",
    "color-on-action-strong": "#FFFFFF",
    "color-progress": "#0F766E",
    "color-pastel-mint": "#D9F5EF",
    "color-pastel-mint-ink": "#0B4F47",
    "color-pastel-sky": "#DCEEFB",
    "color-pastel-sky-ink": "#0F4C81",
    "color-pastel-lavender": "#E8E7FB",
    "color-pastel-lavender-ink": "#3730A3",
    "color-pastel-peach": "#FDEBDD",
    "color-pastel-peach-ink": "#7C2D12",
    "color-pastel-rose": "#FBE4EA",
    "color-pastel-rose-ink": "#9F1239",
    "color-pastel-lemon": "#FBF3CF",
    "color-pastel-lemon-ink": "#713F12",
    "color-vital-text": "#15803D",
    "color-streak-text": "#C2410C",
    "color-xp-text": "#5B21B6",
    "color-gold-text": "#A16207",
  },
  dark: {
    "color-canvas": "#0B1220",
    "color-surface": "#111A2E",
    "color-ink": "#E2E8F0",
    "color-muted": "#94A3B8",
    "color-line": "#1E293B",
    "color-clinic": "#7DB7E8",
    "color-action": "#2DD4BF",
    "color-action-ink": "#042F2E",
    "color-action-strong": "#0F766E",
    "color-on-action-strong": "#FFFFFF",
    "color-progress": "#2DD4BF",
    "color-pastel-mint": "#123B36",
    "color-pastel-mint-ink": "#A7F3D0",
    "color-pastel-sky": "#13324F",
    "color-pastel-sky-ink": "#BAE6FD",
    "color-pastel-lavender": "#26244A",
    "color-pastel-lavender-ink": "#C7D2FE",
    "color-pastel-peach": "#3D2618",
    "color-pastel-peach-ink": "#FED7AA",
    "color-pastel-rose": "#3F1D27",
    "color-pastel-rose-ink": "#FECDD3",
    "color-pastel-lemon": "#3A3214",
    "color-pastel-lemon-ink": "#FDE68A",
    "color-vital-text": "#86EFAC",
    "color-streak-text": "#FDBA74",
    "color-xp-text": "#C4B5FD",
    "color-gold-text": "#FCD34D",
  },
} as const;

export type ThemeName = keyof typeof THEMES;
export type ColorToken = keyof (typeof THEMES)["light"];

/** WCAG 2.2: 4.5:1 texto normal (1.4.3) · 3:1 iconos, trazos y bordes de controles (1.4.11). */
export const AA_TEXT = 4.5;
export const AA_GRAPHIC = 3;

export interface ContrastPair {
  foreground: ColorToken;
  background: ColorToken;
  minRatio: number;
}

const PASTELS = ["mint", "sky", "lavender", "peach", "rose", "lemon"] as const;

const pastelPairs: ContrastPair[] = PASTELS.map((name) => ({
  foreground: `color-pastel-${name}-ink`,
  background: `color-pastel-${name}`,
  minRatio: AA_TEXT,
}));

/** Todo par texto/fondo o gráfico/fondo que la UI usa. Si se agrega uno, va aquí. */
export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  { foreground: "color-ink", background: "color-canvas", minRatio: AA_TEXT },
  { foreground: "color-ink", background: "color-surface", minRatio: AA_TEXT },
  { foreground: "color-muted", background: "color-canvas", minRatio: AA_TEXT },
  { foreground: "color-muted", background: "color-surface", minRatio: AA_TEXT },
  { foreground: "color-clinic", background: "color-surface", minRatio: AA_TEXT },
  { foreground: "color-clinic", background: "color-canvas", minRatio: AA_TEXT },
  { foreground: "color-action-ink", background: "color-action", minRatio: AA_TEXT },
  { foreground: "color-on-action-strong", background: "color-action-strong", minRatio: AA_TEXT },
  { foreground: "color-action-strong", background: "color-surface", minRatio: AA_GRAPHIC },
  { foreground: "color-progress", background: "color-surface", minRatio: AA_GRAPHIC },
  { foreground: "color-progress", background: "color-pastel-mint", minRatio: AA_GRAPHIC },
  { foreground: "color-progress", background: "color-pastel-sky", minRatio: AA_GRAPHIC },
  { foreground: "color-ink", background: "color-pastel-sky", minRatio: AA_TEXT },
  { foreground: "color-clinic", background: "color-pastel-mint", minRatio: AA_TEXT },
  { foreground: "color-clinic", background: "color-pastel-sky", minRatio: AA_TEXT },
  { foreground: "color-ink", background: "color-pastel-mint", minRatio: AA_TEXT },
  { foreground: "color-pastel-mint-ink", background: "color-surface", minRatio: AA_TEXT },
  ...pastelPairs,
  ...(["vital", "streak", "xp", "gold"] as const).flatMap((name): ContrastPair[] => [
    { foreground: `color-${name}-text`, background: "color-surface", minRatio: AA_TEXT },
    { foreground: `color-${name}-text`, background: "color-canvas", minRatio: AA_TEXT },
  ]),
];

/**
 * Semáforo OMS y bandera roja: iguales en claro y oscuro (no se pastelizan ni
 * se suavizan). Se verifican aparte porque no cambian con el tema.
 */
export const RISK_COLORS = {
  "color-risk-low": "#166534",
  "color-risk-low-bg": "#dcfce7",
  "color-risk-moderate": "#b45309",
  "color-risk-moderate-bg": "#fef3c7",
  "color-risk-high": "#b91c1c",
  "color-risk-high-bg": "#fee2e2",
} as const;

export const RISK_CONTRAST_PAIRS: readonly { foreground: string; background: string; label: string }[] = [
  { label: "riesgo bajo", foreground: RISK_COLORS["color-risk-low"], background: RISK_COLORS["color-risk-low-bg"] },
  { label: "riesgo moderado", foreground: RISK_COLORS["color-risk-moderate"], background: RISK_COLORS["color-risk-moderate-bg"] },
  { label: "riesgo alto", foreground: RISK_COLORS["color-risk-high"], background: RISK_COLORS["color-risk-high-bg"] },
  { label: "botón de evaluación reumatológica", foreground: "#FFFFFF", background: RISK_COLORS["color-risk-high"] },
];

/**
 * Capa "viva" (gamificación con Artiko): rellenos brillantes iguales en claro y
 * oscuro, cada uno con su tinta (`-ink`) y su borde 3D (`-deep`). Nunca se usan
 * para el semáforo OMS ni para la bandera roja, y ninguno repite un color
 * `risk-*` (lo verifica contrast.test.ts).
 */
export const GAME_COLORS = {
  "color-vital": "#22C55E",
  "color-vital-strong": "#10B981",
  "color-vital-ink": "#052E16",
  "color-vital-deep": "#15803D",
  "color-lime": "#84CC16",
  "color-streak": "#F97316",
  "color-streak-hot": "#FF5A1F",
  "color-streak-ink": "#431407",
  "color-streak-deep": "#C2410C",
  "color-xp": "#8B5CF6",
  "color-xp-strong": "#7C3AED",
  "color-xp-ink": "#FFFFFF",
  "color-xp-deep": "#5B21B6",
  "color-gold": "#F59E0B",
  "color-gold-ink": "#451A03",
  "color-gold-deep": "#A16207",
  "color-sky": "#38BDF8",
  "color-sky-ink": "#082F49",
  "color-sky-deep": "#0369A1",
  "color-pink": "#FF7EB6",
  "color-pink-ink": "#500724",
  "color-pink-deep": "#BE185D",
  "color-clinic-deep": "#0A365C",
} as const;

export type GameColorToken = keyof typeof GAME_COLORS;

/** Texto sobre relleno: 4.5:1. Relleno o borde 3D sobre blanco: 3:1 (WCAG 1.4.11). */
export const GAME_CONTRAST_PAIRS: readonly { foreground: GameColorToken | "white"; background: GameColorToken | "white"; minRatio: number }[] = [
  { foreground: "color-vital-ink", background: "color-vital", minRatio: AA_TEXT },
  { foreground: "color-vital-ink", background: "color-vital-strong", minRatio: AA_TEXT },
  { foreground: "color-streak-ink", background: "color-streak", minRatio: AA_TEXT },
  { foreground: "color-streak-ink", background: "color-streak-hot", minRatio: AA_TEXT },
  { foreground: "color-xp-ink", background: "color-xp-strong", minRatio: AA_TEXT },
  { foreground: "color-gold-ink", background: "color-gold", minRatio: AA_TEXT },
  { foreground: "color-sky-ink", background: "color-sky", minRatio: AA_TEXT },
  { foreground: "color-pink-ink", background: "color-pink", minRatio: AA_TEXT },
  { foreground: "color-vital-deep", background: "white", minRatio: AA_GRAPHIC },
  { foreground: "color-streak-deep", background: "white", minRatio: AA_GRAPHIC },
  { foreground: "color-xp", background: "white", minRatio: AA_GRAPHIC },
  { foreground: "color-xp-deep", background: "white", minRatio: AA_GRAPHIC },
  { foreground: "color-gold-deep", background: "white", minRatio: AA_GRAPHIC },
  { foreground: "color-sky-deep", background: "white", minRatio: AA_GRAPHIC },
  { foreground: "color-pink-deep", background: "white", minRatio: AA_GRAPHIC },
  { foreground: "color-clinic-deep", background: "white", minRatio: AA_GRAPHIC },
];
