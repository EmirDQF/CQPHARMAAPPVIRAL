// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateStreakDays, markDoseTaken, pillboxStore } from "./pillbox";
import type { PillboxState } from "./types";

const BOTH_DOSES = ["morning-collagen", "night-magnesium"];

function stateWithCompleteDays(dates: string[]): PillboxState {
  return {
    takenDoseIdsByDate: Object.fromEntries(dates.map((date) => [date, BOTH_DOSES])),
  };
}

afterEach(() => {
  vi.useRealTimers();
  pillboxStore.write({ takenDoseIdsByDate: {} });
});

describe("markDoseTaken", () => {
  it("records a 21:30 Lima dose under the Lima date, not tomorrow's UTC date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-24T02:30:00Z"));

    markDoseTaken("night-magnesium");

    expect(pillboxStore.getSnapshot().takenDoseIdsByDate).toEqual({
      "2026-09-23": ["night-magnesium"],
    });
  });

  it("does not duplicate a dose already taken today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-23T14:00:00Z"));

    markDoseTaken("morning-collagen");
    markDoseTaken("morning-collagen");

    expect(pillboxStore.getSnapshot().takenDoseIdsByDate["2026-09-23"]).toEqual([
      "morning-collagen",
    ]);
  });
});

describe("calculateStreakDays", () => {
  it("counts consecutive complete days ending today in Lima", () => {
    const state = stateWithCompleteDays(["2026-09-21", "2026-09-22", "2026-09-23"]);
    const lateNightInLima = new Date("2026-09-24T04:30:00Z");

    expect(calculateStreakDays(state, lateNightInLima)).toBe(3);
  });

  it("stops at the first incomplete day", () => {
    const state: PillboxState = {
      takenDoseIdsByDate: {
        "2026-09-21": BOTH_DOSES,
        "2026-09-22": ["morning-collagen"],
        "2026-09-23": BOTH_DOSES,
      },
    };

    expect(calculateStreakDays(state, new Date("2026-09-23T15:00:00Z"))).toBe(1);
  });

  it("returns 0 when today is not complete yet", () => {
    const state = stateWithCompleteDays(["2026-09-22"]);
    expect(calculateStreakDays(state, new Date("2026-09-23T15:00:00Z"))).toBe(0);
  });

  it("keeps the streak across a month boundary", () => {
    const state = stateWithCompleteDays(["2026-09-30", "2026-10-01"]);
    expect(calculateStreakDays(state, new Date("2026-10-01T15:00:00Z"))).toBe(2);
  });
});
