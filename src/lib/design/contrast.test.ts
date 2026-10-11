import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";
import { CONTRAST_PAIRS, THEMES, type ThemeName } from "./tokens";

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
