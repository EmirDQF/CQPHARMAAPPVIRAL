/**
 * Sistema de diseño "Clínico sereno" (pastel claro, tinta oscura). Fuente de
 * verdad de los colores: src/app/globals.css declara exactamente estos
 * valores (lo verifica contrast.test.ts) y los componentes solo usan las
 * utilidades de Tailwind que salen de ellos (bg-pastel-mint, text-clinic, …),
 * nunca hex sueltos.
 *
 * Reglas de uso (docs/DESIGN.md):
 * - Pasteles = rellenos de botones, tarjetas, gráficas e insignias, siempre
 *   con su tinta (`-ink`) encima y su borde (`-edge`) cuando delimitan un control.
 * - `-edge` es el único tono que sirve como trazo o barra sobre el lienzo (≥ 3:1).
 * - Los colores del semáforo OMS y de la bandera roja (`--color-risk-*`) NO
 *   pertenecen a esta capa, no se pastelizan y ningún pastel se les parece.
 */
export const PASTELS = ["mint", "sky", "lavender", "peach", "rose", "lemon"] as const;
export type PastelName = (typeof PASTELS)[number];

export const THEMES = {
  light: {
    "color-canvas": "#FBF8F3",
    "color-surface": "#FFFFFF",
    "color-ink": "#1F2A37",
    "color-muted": "#5B6573",
    "color-line": "#E7E1D7",
    "color-clinic": "#1F4E79",
    "color-action": "#C9E8E4",
    "color-action-hover": "#B4DDD7",
    "color-action-ink": "#0F3D2E",
    "color-action-edge": "#3F8A7E",
    "color-progress": "#3F8A7E",
    "color-pastel-mint": "#C9E8E4",
    "color-pastel-mint-ink": "#0F3D2E",
    "color-pastel-mint-edge": "#3F8A7E",
    "color-pastel-sky": "#CFE3F5",
    "color-pastel-sky-ink": "#123A5C",
    "color-pastel-sky-edge": "#4F86B8",
    "color-pastel-lavender": "#E0DAF2",
    "color-pastel-lavender-ink": "#3A2F66",
    "color-pastel-lavender-edge": "#8273B8",
    "color-pastel-peach": "#FBDCC8",
    "color-pastel-peach-ink": "#6B2E12",
    "color-pastel-peach-edge": "#C0703F",
    "color-pastel-rose": "#EED3E6",
    "color-pastel-rose-ink": "#6B1F36",
    "color-pastel-rose-edge": "#B5679A",
    "color-pastel-lemon": "#F1EBD6",
    "color-pastel-lemon-ink": "#5A4608",
    "color-pastel-lemon-edge": "#8F8045",
  },
  dark: {
    "color-canvas": "#141A22",
    "color-surface": "#1C2430",
    "color-ink": "#E8EDF2",
    "color-muted": "#A7B2BE",
    "color-line": "#2E3946",
    "color-clinic": "#9CC3E8",
    "color-action": "#234640",
    "color-action-hover": "#2B544D",
    "color-action-ink": "#C9E8E4",
    "color-action-edge": "#6DB8AA",
    "color-progress": "#6DB8AA",
    "color-pastel-mint": "#234640",
    "color-pastel-mint-ink": "#C9E8E4",
    "color-pastel-mint-edge": "#6DB8AA",
    "color-pastel-sky": "#213A52",
    "color-pastel-sky-ink": "#CFE3F5",
    "color-pastel-sky-edge": "#78A9D6",
    "color-pastel-lavender": "#312C4A",
    "color-pastel-lavender-ink": "#E0DAF2",
    "color-pastel-lavender-edge": "#A193D6",
    "color-pastel-peach": "#4A3022",
    "color-pastel-peach-ink": "#FBDCC8",
    "color-pastel-peach-edge": "#D99467",
    "color-pastel-rose": "#46293A",
    "color-pastel-rose-ink": "#EED3E6",
    "color-pastel-rose-edge": "#CF8CB3",
    "color-pastel-lemon": "#3D3826",
    "color-pastel-lemon-ink": "#F1EBD6",
    "color-pastel-lemon-edge": "#C2B27A",
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

const pastelPairs: ContrastPair[] = PASTELS.flatMap((name): ContrastPair[] => [
  { foreground: `color-pastel-${name}-ink`, background: `color-pastel-${name}`, minRatio: AA_TEXT },
  { foreground: "color-ink", background: `color-pastel-${name}`, minRatio: AA_TEXT },
  // La tinta también se usa como texto de color sobre la tarjeta y el lienzo (XP, racha, logros).
  { foreground: `color-pastel-${name}-ink`, background: "color-surface", minRatio: AA_TEXT },
  { foreground: `color-pastel-${name}-ink`, background: "color-canvas", minRatio: AA_TEXT },
  // Borde de un control pastel y barras de progreso: deben verse sobre la tarjeta y el lienzo.
  { foreground: `color-pastel-${name}-edge`, background: "color-surface", minRatio: AA_GRAPHIC },
  { foreground: `color-pastel-${name}-edge`, background: "color-canvas", minRatio: AA_GRAPHIC },
]);

/** Todo par texto/fondo o gráfico/fondo que la UI usa. Si se agrega uno, va aquí. */
export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  { foreground: "color-ink", background: "color-canvas", minRatio: AA_TEXT },
  { foreground: "color-ink", background: "color-surface", minRatio: AA_TEXT },
  { foreground: "color-muted", background: "color-canvas", minRatio: AA_TEXT },
  { foreground: "color-muted", background: "color-surface", minRatio: AA_TEXT },
  { foreground: "color-clinic", background: "color-surface", minRatio: AA_TEXT },
  { foreground: "color-clinic", background: "color-canvas", minRatio: AA_TEXT },
  { foreground: "color-clinic", background: "color-pastel-mint", minRatio: AA_TEXT },
  { foreground: "color-clinic", background: "color-pastel-sky", minRatio: AA_TEXT },
  { foreground: "color-action-ink", background: "color-action", minRatio: AA_TEXT },
  { foreground: "color-action-ink", background: "color-action-hover", minRatio: AA_TEXT },
  { foreground: "color-action-edge", background: "color-surface", minRatio: AA_GRAPHIC },
  { foreground: "color-action-edge", background: "color-canvas", minRatio: AA_GRAPHIC },
  { foreground: "color-progress", background: "color-surface", minRatio: AA_GRAPHIC },
  { foreground: "color-progress", background: "color-canvas", minRatio: AA_GRAPHIC },
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

/**
 * Distancia perceptual mínima (CIE76 ΔE) entre cualquier color decorativo y
 * cualquier color del semáforo: por debajo de ~10 dos colores se confunden a
 * simple vista, y un logro no puede parecer una alerta clínica.
 */
export const MIN_DISTANCE_FROM_RISK = 10;

/** Tokens que no son decorativos (lienzo, texto, bordes neutros): no compiten con el semáforo. */
export const NEUTRAL_TOKENS: ReadonlySet<ColorToken> = new Set([
  "color-canvas",
  "color-surface",
  "color-ink",
  "color-muted",
  "color-line",
  "color-clinic",
]);

/**
 * Capa viva (Artiko): los tonos de juego son alias de la paleta pastel, en
 * claro y en oscuro (`--color-vital` = `--color-pastel-mint`, `-ink` y `-deep`
 * = su tinta y su borde). No existen rellenos saturados propios.
 */
export const GAME_TONE_PASTEL = {
  vital: "mint",
  streak: "peach",
  xp: "lavender",
  gold: "lemon",
  sky: "sky",
  pink: "rose",
} as const satisfies Record<string, PastelName>;

/** Contorno de Artiko e ilustraciones: tinta suave fija (no negro puro), igual en ambos temas. */
export const ILLUSTRATION_OUTLINE = "#2B3A4A";
