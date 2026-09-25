import { describe, expect, it } from "vitest";
import type { PainLogEntry } from "../dashboard/types";
import {
  detectRedFlags,
  hasSeverePainStreak,
  isPartOfSeverePainStreak,
  isRedFlagDexaScan,
} from "./redFlags";

// 12:00 en Lima del 2026-09-24.
const LIMA_NOON = new Date("2026-09-24T17:00:00Z");

function painOn(date: string, painLevel: number): PainLogEntry {
  return { date, painLevel, stiffness: "0-15" };
}

describe("detectRedFlags", () => {
  it("returns no flags without scan or fracture history", () => {
    expect(detectRedFlags({ worstTScore: null, hasFractureHistory: false })).toEqual([]);
  });

  it("flags osteoporosis at exactly T = -2.5", () => {
    expect(detectRedFlags({ worstTScore: -2.5, hasFractureHistory: false })).toEqual([
      "osteoporosis",
    ]);
  });

  it("does not flag osteopenia", () => {
    expect(detectRedFlags({ worstTScore: -2.49, hasFractureHistory: false })).toEqual([]);
  });

  it("flags fracture history even without a scan", () => {
    expect(detectRedFlags({ worstTScore: null, hasFractureHistory: true })).toEqual([
      "fracture-history",
    ]);
  });

  it("does not flag an unanswered fracture question", () => {
    expect(detectRedFlags({ worstTScore: null, hasFractureHistory: null })).toEqual([]);
  });

  it("returns both flags when both apply", () => {
    expect(detectRedFlags({ worstTScore: -3.1, hasFractureHistory: true })).toEqual([
      "osteoporosis",
      "fracture-history",
    ]);
  });

  it("uses a Z-score flag instead of osteoporosis when T-score does not apply", () => {
    expect(
      detectRedFlags({ worstTScore: -2.8, requiresZScore: true, hasFractureHistory: false })
    ).toEqual(["low-bone-density-zscore"]);
  });

  it("does not flag a Z-score patient above the osteoporosis threshold", () => {
    expect(
      detectRedFlags({ worstTScore: -1.8, requiresZScore: true, hasFractureHistory: false })
    ).toEqual([]);
  });

  it("adds the severe pain flag from the pain log", () => {
    const painEntries = [
      painOn("2026-09-22", 8),
      painOn("2026-09-23", 9),
      painOn("2026-09-24", 8),
    ];
    expect(
      detectRedFlags({
        worstTScore: null,
        hasFractureHistory: false,
        painEntries,
        referenceDate: LIMA_NOON,
      })
    ).toEqual(["severe-pain-streak"]);
  });
});

describe("hasSeverePainStreak", () => {
  it("does not flag two consecutive days", () => {
    const entries = [painOn("2026-09-23", 9), painOn("2026-09-24", 9)];
    expect(hasSeverePainStreak(entries, LIMA_NOON)).toBe(false);
  });

  it("flags three consecutive days", () => {
    const entries = [painOn("2026-09-20", 8), painOn("2026-09-21", 8), painOn("2026-09-22", 8)];
    expect(hasSeverePainStreak(entries, LIMA_NOON)).toBe(true);
  });

  it("does not flag three non-consecutive days", () => {
    const entries = [painOn("2026-09-20", 8), painOn("2026-09-21", 8), painOn("2026-09-23", 8)];
    expect(hasSeverePainStreak(entries, LIMA_NOON)).toBe(false);
  });

  it("counts pain 8 but not pain 7", () => {
    const withSeven = [painOn("2026-09-20", 8), painOn("2026-09-21", 7), painOn("2026-09-22", 8)];
    expect(hasSeverePainStreak(withSeven, LIMA_NOON)).toBe(false);
  });

  it("ignores entry order", () => {
    const entries = [painOn("2026-09-22", 10), painOn("2026-09-20", 10), painOn("2026-09-21", 10)];
    expect(hasSeverePainStreak(entries, LIMA_NOON)).toBe(true);
  });

  it("accepts a streak starting on the oldest day of the 14-day window", () => {
    const entries = [painOn("2026-09-11", 8), painOn("2026-09-12", 8), painOn("2026-09-13", 8)];
    expect(hasSeverePainStreak(entries, LIMA_NOON)).toBe(true);
  });

  it("ignores a streak that is only partly inside the 14-day window", () => {
    const entries = [painOn("2026-09-10", 8), painOn("2026-09-11", 8), painOn("2026-09-12", 8)];
    expect(hasSeverePainStreak(entries, LIMA_NOON)).toBe(false);
  });

  it("uses the Lima date, not UTC, to build the window", () => {
    // 22:00 del 24 en Lima = 03:00 del 25 en UTC: el día 11 aún está dentro de la ventana.
    const limaNight = new Date("2026-09-25T03:00:00Z");
    const entries = [painOn("2026-09-11", 8), painOn("2026-09-12", 8), painOn("2026-09-13", 8)];
    expect(hasSeverePainStreak(entries, limaNight)).toBe(true);
  });
});

describe("pain level 0 (sin dolor)", () => {
  it("never counts toward the severe pain streak", () => {
    const entries = [painOn("2026-09-20", 0), painOn("2026-09-21", 0), painOn("2026-09-22", 0)];
    expect(hasSeverePainStreak(entries, LIMA_NOON)).toBe(false);
  });

  it("breaks a streak like any other level below 8", () => {
    const entries = [painOn("2026-09-20", 9), painOn("2026-09-21", 0), painOn("2026-09-22", 9)];
    expect(hasSeverePainStreak(entries, LIMA_NOON)).toBe(false);
  });
});

describe("isRedFlagDexaScan", () => {
  it.each([
    [-2.5, -1.0, true],
    [-1.0, -2.6, true],
    [-2.49, -1.0, false],
    [-1.0, -1.0, false],
  ] as const)("lumbar %s / femoral %s → %s", (lumbarTScore, femoralNeckTScore, expected) => {
    expect(isRedFlagDexaScan({ lumbarTScore, femoralNeckTScore })).toBe(expected);
  });
});

describe("isPartOfSeverePainStreak", () => {
  const streak = [painOn("2026-09-20", 8), painOn("2026-09-21", 9), painOn("2026-09-22", 8)];

  it("flags every day of a 3-day streak of pain >= 8", () => {
    for (const entry of streak) {
      expect(isPartOfSeverePainStreak(entry, streak, LIMA_NOON)).toBe(true);
    }
  });

  it("does not flag a severe day outside any streak", () => {
    const entries = [...streak, painOn("2026-09-24", 10)];
    expect(isPartOfSeverePainStreak(painOn("2026-09-24", 10), entries, LIMA_NOON)).toBe(false);
  });

  it("does not flag a 2-day streak or a day below 8", () => {
    const twoDays = [painOn("2026-09-20", 8), painOn("2026-09-21", 8)];
    expect(isPartOfSeverePainStreak(twoDays[0], twoDays, LIMA_NOON)).toBe(false);
    const withSeven = [...streak, painOn("2026-09-23", 7)];
    expect(isPartOfSeverePainStreak(painOn("2026-09-23", 7), withSeven, LIMA_NOON)).toBe(false);
  });

  it("does not flag a streak outside the 14-day window", () => {
    const old = [painOn("2026-09-01", 9), painOn("2026-09-02", 9), painOn("2026-09-03", 9)];
    expect(isPartOfSeverePainStreak(old[1], old, LIMA_NOON)).toBe(false);
  });
});
