import { describe, expect, it } from "vitest";
import { PAIN_LEVEL_MAX } from "../clinical/constants";
import { buildPainBars, MIN_VISIBLE_BAR_HEIGHT } from "./painChart";

const SIZE = { width: 300, height: 100 };

describe("buildPainBars", () => {
  it("returns no bars without entries", () => {
    expect(buildPainBars([], SIZE)).toEqual([]);
  });

  it("scales the height to the 0–10 scale", () => {
    const [bar] = buildPainBars([{ date: "2026-09-01", painLevel: PAIN_LEVEL_MAX, stiffness: "0-15" }], SIZE);
    expect(bar.height).toBe(SIZE.height);
    expect(bar.y).toBe(0);
  });

  it("keeps a day with pain 0 visible as a registered day", () => {
    const [bar] = buildPainBars([{ date: "2026-09-01", painLevel: 0, stiffness: "0-15" }], SIZE);
    expect(bar.isPainFree).toBe(true);
    expect(bar.height).toBe(MIN_VISIBLE_BAR_HEIGHT);
    expect(bar.y).toBe(SIZE.height - MIN_VISIBLE_BAR_HEIGHT);
  });
});
