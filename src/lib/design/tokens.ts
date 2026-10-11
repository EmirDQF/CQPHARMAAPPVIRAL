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
