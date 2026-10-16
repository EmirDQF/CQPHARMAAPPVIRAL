import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { findForbiddenPhrases } from "../clinical/forbiddenCopy";
import { EMPTY_GAME_PROGRESS } from "../gamification/progress";
import { LESSONS } from "../learn/lessons";
import { REWARD_COMMERCIAL_ENABLED } from "./commercial";
import { dailyChestContent, isChestOpened, withChestOpened } from "./dailyChest";

const DAY = new Date("2026-10-16T17:00:00.000Z");
const NEXT_DAY = new Date("2026-10-17T17:00:00.000Z");

describe("cofre del día", () => {
  it("brings an educational fact with its source and a kind phrase", () => {
    const content = dailyChestContent(DAY, false);
    expect(LESSONS.map((lesson) => lesson.keyPoint)).toContain(content.fact);
    expect(content.source.length).toBeGreaterThan(0);
    expect(findForbiddenPhrases(content.phrase)).toEqual([]);
  });

  it("changes topic from one day to the next", () => {
    expect(dailyChestContent(NEXT_DAY, false).fact).not.toBe(dailyChestContent(DAY, false).fact);
  });

  it("never shows a movement lesson with a red flag", () => {
    for (let offset = 0; offset < LESSONS.length; offset += 1) {
      const date = new Date(DAY.getTime() + offset * 86_400_000);
      const content = dailyChestContent(date, true);
      const lesson = LESSONS.find((item) => item.keyPoint === content.fact);
      expect(lesson?.physical).toBe(false);
    }
  });

  it("opens once per Lima day", () => {
    const opened = withChestOpened(EMPTY_GAME_PROGRESS, "2026-10-16");
    expect(isChestOpened(opened, "2026-10-16")).toBe(true);
    expect(withChestOpened(opened, "2026-10-16")).toBe(opened);
    expect(isChestOpened(opened, "2026-10-17")).toBe(false);
  });
});

describe("REWARD_COMMERCIAL_ENABLED", () => {
  it("stays off until the user decides (commercial and legal review)", () => {
    expect(REWARD_COMMERCIAL_ENABLED).toBe(false);
  });

  it("no reward, badge, game or chest mentions purchases or discounts", () => {
    const dirs = ["src/lib/rewards", "src/lib/gamification", "src/components/games", "src/components/rewards"];
    const files = dirs.flatMap((dir) =>
      readdirSync(dir)
        .map((name) => join(dir, name))
        .filter((path) => statSync(path).isFile() && /\.tsx?$/.test(path) && !/\.test\./.test(path) && !path.endsWith("commercial.ts"))
    );
    for (const file of files) {
      const code = readFileSync(file, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
      expect(code, file).not.toMatch(/descuento|cup[oó]n|compra[rs]?\b/i);
    }
  });
});
