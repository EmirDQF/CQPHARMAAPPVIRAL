/** Contraste WCAG 2.x entre dos colores #RRGGBB (1 = igual, 21 = negro sobre blanco). */
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const LINEAR_THRESHOLD = 0.04045;
const LINEAR_DIVISOR = 12.92;
const GAMMA_OFFSET = 0.055;
const GAMMA_DIVISOR = 1.055;
const GAMMA_EXPONENT = 2.4;
const LUMINANCE_WEIGHTS = [0.2126, 0.7152, 0.0722] as const;
const FLARE = 0.05;
const CHANNEL_MAX = 255;
const HEX_RADIX = 16;

function relativeLuminance(hex: string): number {
  if (!HEX_COLOR.test(hex)) throw new Error(`Color no válido (se espera hex #RRGGBB): ${hex}`);
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), HEX_RADIX) / CHANNEL_MAX);
  return channels
    .map((value) =>
      value <= LINEAR_THRESHOLD ? value / LINEAR_DIVISOR : ((value + GAMMA_OFFSET) / GAMMA_DIVISOR) ** GAMMA_EXPONENT
    )
    .reduce((sum, value, index) => sum + value * LUMINANCE_WEIGHTS[index], 0);
}

export function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (lighter + FLARE) / (darker + FLARE);
}
