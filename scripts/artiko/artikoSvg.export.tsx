import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { ArtikoFigure } from "@/components/mascot/ArtikoFigure";
import { ILLUSTRATION_OUTLINE } from "@/lib/design/tokens";

/**
 * Exporta a Artiko como SVG autónomo (logo de la app): el mismo dibujo de la app,
 * sin clases de animación y con el contorno fijado (fuera de la app no hay globals.css).
 * Lo consume scripts/generate-android-assets.mjs.
 */
export const ARTIKO_LOGO_EMOTION = "welcome";
const OUTPUT = join("scripts", "artiko", ".out", "artiko.svg");

it("exporta el SVG de Artiko", () => {
  const markup = renderToStaticMarkup(<ArtikoFigure emotion={ARTIKO_LOGO_EMOTION} size={140} decorative />)
    .replace(/ class="[^"]*"/g, "")
    .replace('style="', `xmlns="http://www.w3.org/2000/svg" style="--color-clinic-deep:${ILLUSTRATION_OUTLINE};`);
  expect(markup).not.toContain("undefined");
  expect(markup).not.toMatch(/var\(--color-(?!clinic-deep|vital|streak|xp|gold|sky|pink)/);
  mkdirSync(join("scripts", "artiko", ".out"), { recursive: true });
  writeFileSync(OUTPUT, markup);
});
