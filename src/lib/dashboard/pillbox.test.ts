// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { addDaysToIsoDate } from "../utils/date";
import { calculateStreak, calculateStreakDays, markDoseTaken, pillboxStore } from "./pillbox";
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

  it("counts from yesterday while today is still pending", () => {
    const state = stateWithCompleteDays(["2026-09-21", "2026-09-22"]);
    expect(calculateStreakDays(state, new Date("2026-09-23T15:00:00Z"))).toBe(2);
  });

  it("returns 0 when there is no history at all", () => {
    expect(calculateStreakDays({ takenDoseIdsByDate: {} }, new Date("2026-09-23T15:00:00Z"))).toBe(0);
  });

  it("keeps the streak across a month boundary", () => {
    const state = stateWithCompleteDays(["2026-09-30", "2026-10-01"]);
    expect(calculateStreakDays(state, new Date("2026-10-01T15:00:00Z"))).toBe(2);
  });

  it("does not break the streak at Lima midnight (UTC already tomorrow)", () => {
    const state = stateWithCompleteDays(["2026-09-22", "2026-09-23"]);
    // 2026-09-24 00:10 en Lima: el día nuevo recién empieza y sigue pendiente.
    const justAfterLimaMidnight = new Date("2026-09-24T05:10:00Z");
    expect(calculateStreakDays(state, justAfterLimaMidnight)).toBe(2);
  });
});

function consecutiveDates(start: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => addDaysToIsoDate(start, index));
}

describe("calculateStreak with Escudo de Constancia", () => {
  const NOON_LIMA = "T17:00:00Z";

  it("earns one shield per 7 complete days, capped at 2", () => {
    expect(calculateStreak(stateWithCompleteDays(consecutiveDates("2026-09-01", 6)), new Date(`2026-09-06${NOON_LIMA}`)).shields).toBe(0);
    expect(calculateStreak(stateWithCompleteDays(consecutiveDates("2026-09-01", 7)), new Date(`2026-09-07${NOON_LIMA}`)).shields).toBe(1);
    expect(calculateStreak(stateWithCompleteDays(consecutiveDates("2026-09-01", 21)), new Date(`2026-09-21${NOON_LIMA}`)).shields).toBe(2);
  });

  it("consumes a shield automatically for one missed day and keeps the streak", () => {
    const dates = [...consecutiveDates("2026-09-01", 7), ...consecutiveDates("2026-09-09", 2)];
    const result = calculateStreak(stateWithCompleteDays(dates), new Date(`2026-09-10${NOON_LIMA}`));
    expect(result).toEqual({ days: 9, shields: 0, todayComplete: true, shieldUsedOn: "2026-09-08" });
  });

  it("breaks the streak on a missed day without shields", () => {
    const dates = [...consecutiveDates("2026-09-01", 6), "2026-09-08"];
    const result = calculateStreak(stateWithCompleteDays(dates), new Date(`2026-09-08${NOON_LIMA}`));
    expect(result.days).toBe(1);
    expect(result.shieldUsedOn).toBeNull();
  });

  it("two missed days in a row break the streak with only one shield", () => {
    const dates = [...consecutiveDates("2026-09-01", 7), "2026-09-10"];
    const result = calculateStreak(stateWithCompleteDays(dates), new Date(`2026-09-10${NOON_LIMA}`));
    expect(result).toEqual({ days: 1, shields: 0, todayComplete: true, shieldUsedOn: null });
  });

  it("two missed days in a row are covered when two shields are saved", () => {
    const dates = [...consecutiveDates("2026-09-01", 14), "2026-09-17"];
    const result = calculateStreak(stateWithCompleteDays(dates), new Date(`2026-09-17${NOON_LIMA}`));
    expect(result).toEqual({ days: 15, shields: 0, todayComplete: true, shieldUsedOn: "2026-09-16" });
  });

  it("never spends a shield on today while it is pending", () => {
    const dates = consecutiveDates("2026-09-01", 7);
    const result = calculateStreak(stateWithCompleteDays(dates), new Date(`2026-09-08${NOON_LIMA}`));
    expect(result).toEqual({ days: 7, shields: 1, todayComplete: false, shieldUsedOn: null });
  });

  it("a partial day (one dose) counts as missed", () => {
    const state: PillboxState = {
      takenDoseIdsByDate: {
        ...stateWithCompleteDays(consecutiveDates("2026-09-01", 7)).takenDoseIdsByDate,
        "2026-09-08": ["morning-collagen"],
        "2026-09-09": BOTH_DOSES,
      },
    };
    const result = calculateStreak(state, new Date(`2026-09-09${NOON_LIMA}`));
    expect(result.days).toBe(8);
    expect(result.shieldUsedOn).toBe("2026-09-08");
  });
});
