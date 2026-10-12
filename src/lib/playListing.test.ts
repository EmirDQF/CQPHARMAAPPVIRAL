import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { findForbiddenPhrases } from "./clinical/forbiddenCopy";

const listing = readFileSync(join(process.cwd(), "docs", "PLAY-LISTING.md"), "utf8").replace(/\r\n/g, "\n");

function section(name: string): string {
  const match = new RegExp(`<!-- ${name} -->\\n([\\s\\S]*?)\\n<!-- /${name} -->`).exec(listing);
  if (!match) throw new Error(`Falta la sección ${name} en docs/PLAY-LISTING.md`);
  return match[1].trim();
}

describe("ficha de Google Play (docs/PLAY-LISTING.md)", () => {
  it("keeps the short description within Play's 80 characters", () => {
    const short = section("descripcion-corta");
    expect(short.length).toBeGreaterThan(0);
    expect(short.length).toBeLessThanOrEqual(80);
  });

  it("keeps the long description within Play's 4000 characters", () => {
    expect(section("descripcion-larga").length).toBeLessThanOrEqual(4000);
  });

  it("says the app does not replace the doctor and makes no cure claims", () => {
    const text = `${section("descripcion-corta")}\n${section("descripcion-larga")}`;
    expect(text).toMatch(/no reemplaza a tu médico/);
    expect(findForbiddenPhrases(text, { categories: ["cura-reversion"] })).toEqual([]);
  });
});
