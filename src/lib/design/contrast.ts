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
  return linearChannels(hex).reduce((sum, value, index) => sum + value * LUMINANCE_WEIGHTS[index], 0);
}

export function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (lighter + FLARE) / (darker + FLARE);
}

/* CIE L*a*b* (D65) para medir qué tan distintos se ven dos colores. */
const D65_WHITE = [0.95047, 1, 1.08883] as const;
const SRGB_TO_XYZ = [
  [0.4124, 0.3576, 0.1805],
  [0.2126, 0.7152, 0.0722],
  [0.0193, 0.1192, 0.9505],
] as const;
const LAB_EPSILON = 216 / 24389;
const LAB_KAPPA = 24389 / 27;
const LAB_L_SCALE = 116;
const LAB_L_OFFSET = 16;
const LAB_A_SCALE = 500;
const LAB_B_SCALE = 200;

function linearChannels(hex: string): number[] {
  if (!HEX_COLOR.test(hex)) throw new Error(`Color no válido (se espera hex #RRGGBB): ${hex}`);
  return [1, 3, 5]
    .map((start) => parseInt(hex.slice(start, start + 2), HEX_RADIX) / CHANNEL_MAX)
    .map((value) =>
      value <= LINEAR_THRESHOLD ? value / LINEAR_DIVISOR : ((value + GAMMA_OFFSET) / GAMMA_DIVISOR) ** GAMMA_EXPONENT
    );
}

function toLab(hex: string): [number, number, number] {
  const rgb = linearChannels(hex);
  const [x, y, z] = SRGB_TO_XYZ.map((row, index) => row.reduce((sum, weight, channel) => sum + weight * rgb[channel], 0) / D65_WHITE[index]);
  const f = (t: number) => (t > LAB_EPSILON ? Math.cbrt(t) : (LAB_KAPPA * t + LAB_L_OFFSET) / LAB_L_SCALE);
  return [LAB_L_SCALE * f(y) - LAB_L_OFFSET, LAB_A_SCALE * (f(x) - f(y)), LAB_B_SCALE * (f(y) - f(z))];
}

/** Diferencia perceptual CIE76 (ΔE): ~0 = idénticos, < 10 = se confunden a simple vista. */
export function colorDistance(first: string, second: string): number {
  const [a, b] = [toLab(first), toLab(second)];
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
