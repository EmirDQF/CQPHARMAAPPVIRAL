import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { colorDistance, contrastRatio } from "./contrast";
import {
  AA_TEXT,
  CONTRAST_PAIRS,
  GAME_TONE_PASTEL,
  ILLUSTRATION_OUTLINE,
  MIN_DISTANCE_FROM_RISK,
  NEUTRAL_TOKENS,
  RISK_COLORS,
  RISK_CONTRAST_PAIRS,
  THEMES,
  type ColorToken,
  type ThemeName,
} from "./tokens";

const css = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");
const DARK_THEME = ':root[data-theme="dark"] {';

/** Bloque CSS de cada tema: `:root` claro (antes del bloque oscuro) y `:root[data-theme="dark"]`. */
function themeBlock(themeName: ThemeName): string {
  if (themeName === "light") return css.split(DARK_THEME)[0];
  return css.split(DARK_THEME)[1].split("}")[0];
}

describe("contrastRatio", () => {
  it("matches the WCAG reference values", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
    expect(contrastRatio("#767676", "#FFFFFF")).toBeCloseTo(4.54, 2);
  });

  it("rejects malformed colors instead of guessing", () => {
    expect(() => contrastRatio("teal", "#FFFFFF")).toThrow(/hex/);
  });
});

describe("colorDistance (CIE76 ΔE)", () => {
  it("is 0 for the same color and ~100 between black and white", () => {
    expect(colorDistance("#B45309", "#b45309")).toBeCloseTo(0, 5);
    expect(colorDistance("#000000", "#FFFFFF")).toBeCloseTo(100, 0);
  });
});

describe.each(Object.keys(THEMES) as ThemeName[])("tema %s", (themeName) => {
  const theme = THEMES[themeName];

  it.each(CONTRAST_PAIRS.map((pair) => [`${pair.foreground} sobre ${pair.background}`, pair] as const))(
    "%s cumple AA",
    (_label, pair) => {
      const ratio = contrastRatio(theme[pair.foreground], theme[pair.background]);
      expect(ratio, `${themeName}: ${pair.foreground}/${pair.background} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(
        pair.minRatio
      );
    }
  );

  it("declares every token in globals.css with the same value", () => {
    const block = themeBlock(themeName);
    Object.entries(theme).forEach(([token, value]) => {
      expect(block, `--${token}`).toMatch(new RegExp(`--${token}:\\s*${value};`, "i"));
    });
  });

  it("uses soft deep surfaces in dark mode, never pure black", () => {
    expect(theme["color-canvas"].toUpperCase()).not.toBe("#000000");
    expect(theme["color-surface"].toUpperCase()).not.toBe("#000000");
  });
});

describe("semáforo OMS y bandera roja", () => {
  it.each(RISK_CONTRAST_PAIRS.map((pair) => [pair.label, pair] as const))("%s cumple AA", (_label, pair) => {
    expect(contrastRatio(pair.foreground, pair.background)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it("keeps the same values in globals.css (only declared once, for both themes)", () => {
    Object.entries(RISK_COLORS).forEach(([token, value]) => {
      const hexDeclarations = css.match(new RegExp(`--${token}:\\s*#[0-9a-f]{6};`, "gi")) ?? [];
      expect(hexDeclarations, `--${token}`).toHaveLength(1);
      expect(hexDeclarations[0]?.toLowerCase()).toContain(value.toLowerCase());
    });
  });
});

describe("capa viva (Artiko)", () => {
  it.each(Object.entries(GAME_TONE_PASTEL))("%s is an alias of the %s pastel (fill, ink and edge)", (tone, pastel) => {
    expect(css).toMatch(new RegExp(`--color-${tone}:\\s*var\\(--color-pastel-${pastel}\\);`));
    expect(css).toMatch(new RegExp(`--color-${tone}-ink:\\s*var\\(--color-pastel-${pastel}-ink\\);`));
    expect(css).toMatch(new RegExp(`--color-${tone}-deep:\\s*var\\(--color-pastel-${pastel}-edge\\);`));
  });

  it("has no saturated fill of its own: every game color in globals.css is an alias", () => {
    const ownHexes = css.match(/--color-(vital|streak|xp|gold|sky|pink|lime)[a-z-]*:\s*#[0-9a-f]{3,8};/gi) ?? [];
    expect(ownHexes).toEqual([]);
  });

  it("draws Artiko with a soft outline, not pure black", () => {
    expect(css).toMatch(new RegExp(`--color-clinic-deep:\\s*${ILLUSTRATION_OUTLINE};`, "i"));
    expect(ILLUSTRATION_OUTLINE.toUpperCase()).not.toBe("#000000");
  });

  it.each(Object.keys(THEMES) as ThemeName[])(
    "never uses a decorative color that looks like a traffic-light (risk) color in the %s theme",
    (themeName) => {
      const theme = THEMES[themeName];
      const tooClose = (Object.entries(theme) as [ColorToken, string][])
        .filter(([token]) => !NEUTRAL_TOKENS.has(token))
        .flatMap(([token, hex]) =>
          Object.entries(RISK_COLORS)
            .map(([riskToken, riskHex]) => ({ token, riskToken, distance: colorDistance(hex, riskHex) }))
            .filter(({ distance }) => distance < MIN_DISTANCE_FROM_RISK)
        );
      expect(tooClose).toEqual([]);
    }
  );
});
