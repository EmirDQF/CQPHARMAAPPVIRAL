import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";
import {
  AA_TEXT,
  CONTRAST_PAIRS,
  GAME_COLORS,
  GAME_CONTRAST_PAIRS,
  RISK_COLORS,
  RISK_CONTRAST_PAIRS,
  THEMES,
  type ThemeName,
} from "./tokens";

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
});

describe("globals.css", () => {
  const css = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");

  it.each(Object.keys(THEMES) as ThemeName[])("declares every %s token with the same value", (themeName) => {
    const block = themeName === "light" ? css.split("@media (prefers-color-scheme: dark)")[0] : css.split("@media (prefers-color-scheme: dark)")[1];
    Object.entries(THEMES[themeName]).forEach(([token, value]) => {
      expect(block, `--${token}`).toMatch(new RegExp(`--${token}:\\s*${value};`, "i"));
    });
  });
});

describe("semáforo OMS y bandera roja", () => {
  const css = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");

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
  const css = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");
  const hexOf = (token: keyof typeof GAME_COLORS | "white") => (token === "white" ? "#FFFFFF" : GAME_COLORS[token]);

  it.each(GAME_CONTRAST_PAIRS.map((pair) => [`${pair.foreground} sobre ${pair.background}`, pair] as const))(
    "%s cumple AA",
    (_label, pair) => {
      const ratio = contrastRatio(hexOf(pair.foreground), hexOf(pair.background));
      expect(ratio, `${pair.foreground}/${pair.background} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(pair.minRatio);
    }
  );

  it("declares every game token once in globals.css with the same value", () => {
    Object.entries(GAME_COLORS).forEach(([token, value]) => {
      const declarations = css.match(new RegExp(`--${token}:\\s*#[0-9a-f]{6};`, "gi")) ?? [];
      expect(declarations, `--${token}`).toHaveLength(1);
      expect(declarations[0]?.toLowerCase()).toContain(value.toLowerCase());
    });
  });

  it("never reuses a traffic-light (risk) color as decoration", () => {
    const riskHexes = new Set(Object.values(RISK_COLORS).map((hex) => hex.toLowerCase()));
    const gameHexes = [
      ...Object.values(GAME_COLORS),
      ...Object.values(THEMES).flatMap((theme) => Object.values(theme)),
    ].map((hex) => hex.toLowerCase());
    expect(gameHexes.filter((hex) => riskHexes.has(hex))).toEqual([]);
  });
});
