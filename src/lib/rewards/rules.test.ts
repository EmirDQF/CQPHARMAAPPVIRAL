import { describe, expect, it } from "vitest";
import type { PainLogEntry, PillboxState } from "../dashboard/types";
import { REWARD_CATALOG } from "./catalog";
import {
  computeHabitStats,
  evaluateRewards,
  goalProgress,
  markCelebrated,
  migrateRewardProgress,
  pendingCelebrations,
} from "./rules";
import { EMPTY_REWARD_PROGRESS, rewardCatalogSchema, type RewardDefinition } from "./schemas";

const BOTH = ["morning-collagen", "night-magnesium"];
const noonLima = (date: string) => new Date(`${date}T12:00:00-05:00`);

function pillboxWithCompleteDays(dates: string[], partial: string[] = []): PillboxState {
  return {
    takenDoseIdsByDate: {
      ...Object.fromEntries(dates.map((date) => [date, BOTH])),
      ...Object.fromEntries(partial.map((date) => [date, ["morning-collagen"]])),
    },
  };
}

function painOn(dates: string[], painLevel = 3): PainLogEntry[] {
  return dates.map((date) => ({ date, painLevel, stiffness: "0-15" }));
}

const reward = (id: string, rule: RewardDefinition["rule"]): RewardDefinition => ({
  id,
  title: "Logro",
  description: "Descripción",
  rule,
  illustration: "star",
  tone: "mint",
});

describe("catálogo", () => {
  it("es válido y no usa frases prohibidas (lo valida Zod al cargar)", () => {
    expect(REWARD_CATALOG.length).toBeGreaterThan(0);
  });

  it("rechaza ids repetidos y copys con promesas de cura o culpa", () => {
    expect(() => rewardCatalogSchema.parse([reward("a-1", { type: "streak", days: 3 }), reward("a-1", { type: "streak", days: 7 })])).toThrow();
    expect(() => rewardCatalogSchema.parse([{ ...reward("a-2", { type: "streak", days: 3 }), description: "Esto cura tus rodillas" }])).toThrow();
    expect(() => rewardCatalogSchema.parse([{ ...reward("a-4", { type: "streak", days: 3 }), title: "Perderás tu racha" }])).toThrow();
  });
});

describe("computeHabitStats", () => {
  it("counts only complete days, never partial ones, and keeps the longest run", () => {
    const pillbox = pillboxWithCompleteDays(["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-07"], ["2026-10-08"]);
    const stats = computeHabitStats(pillbox, [], noonLima("2026-10-08"));
    expect(stats.completeDays).toBe(4);
    expect(stats.longestRun).toBe(3);
    expect(stats.longestGapBeforeReturn).toBe(3);
  });

  it("counts check-in days whatever pain was recorded (high or low pain earns the same)", () => {
    const stats = computeHabitStats({ takenDoseIdsByDate: {} }, [...painOn(["2026-10-01"], 9), ...painOn(["2026-10-02"], 0)], noonLima("2026-10-02"));
    expect(stats.checkInDays).toBe(2);
    expect(stats.checkInThisMonth).toBe(true);
  });
});

describe("evaluateRewards", () => {
  const catalog = [
    reward("dia-1", { type: "completeDays", total: 1 }),
    reward("racha-3", { type: "streak", days: 3 }),
    reward("mes", { type: "monthlyCheckIn" }),
    reward("vuelta", { type: "returnAfterBreak", gapDays: 2 }),
  ];

  it("unlocks by consistency and is idempotent", () => {
    const pillbox = pillboxWithCompleteDays(["2026-10-01", "2026-10-02", "2026-10-03"]);
    const stats = computeHabitStats(pillbox, [], noonLima("2026-10-03"));
    const first = evaluateRewards(catalog, stats, EMPTY_REWARD_PROGRESS, "2026-10-03");
    expect(first.newlyUnlocked.map((item) => item.key)).toEqual(["dia-1", "racha-3"]);

    const second = evaluateRewards(catalog, stats, first.progress, "2026-10-04");
    expect(second.newlyUnlocked).toEqual([]);
    expect(second.progress).toBe(first.progress);
  });

  it("never takes back an unlocked reward when the streak resets", () => {
    const unlocked = evaluateRewards(catalog, computeHabitStats(pillboxWithCompleteDays(["2026-10-01", "2026-10-02", "2026-10-03"]), [], noonLima("2026-10-03")), EMPTY_REWARD_PROGRESS, "2026-10-03");
    const afterBreak = computeHabitStats(pillboxWithCompleteDays(["2026-10-01", "2026-10-02", "2026-10-03"]), [], noonLima("2026-10-20"));
    expect(afterBreak.currentStreak).toBe(0);
    const result = evaluateRewards(catalog, afterBreak, unlocked.progress, "2026-10-20");
    expect(result.progress.unlocked.map((item) => item.key)).toEqual(["dia-1", "racha-3"]);
  });

  it("unlocks the monthly check-in once per Lima month", () => {
    const october = computeHabitStats({ takenDoseIdsByDate: {} }, painOn(["2026-10-05"]), noonLima("2026-10-05"));
    const once = evaluateRewards(catalog, october, EMPTY_REWARD_PROGRESS, "2026-10-05");
    expect(once.newlyUnlocked.map((item) => item.key)).toEqual(["mes:2026-10"]);
    const november = computeHabitStats({ takenDoseIdsByDate: {} }, painOn(["2026-10-05", "2026-11-02"]), noonLima("2026-11-02"));
    expect(evaluateRewards(catalog, november, once.progress, "2026-11-02").newlyUnlocked.map((item) => item.key)).toEqual(["mes:2026-11"]);
  });

  it("welcomes back after a pause instead of punishing it", () => {
    const stats = computeHabitStats(pillboxWithCompleteDays(["2026-10-01", "2026-10-05"]), [], noonLima("2026-10-05"));
    expect(evaluateRewards(catalog, stats, EMPTY_REWARD_PROGRESS, "2026-10-05").newlyUnlocked.map((item) => item.key)).toContain("vuelta");
  });
});

describe("goalProgress", () => {
  it("shows how close the next goal is, capped at the target", () => {
    const stats = computeHabitStats(pillboxWithCompleteDays(["2026-10-01", "2026-10-02"]), [], noonLima("2026-10-02"));
    expect(goalProgress({ type: "streak", days: 7 }, stats)).toEqual({ current: 2, target: 7 });
    expect(goalProgress({ type: "completeDays", total: 1 }, stats)).toEqual({ current: 1, target: 1 });
    expect(goalProgress({ type: "returnAfterBreak", gapDays: 2 }, stats)).toBeNull();
  });
});

describe("celebraciones", () => {
  it("celebrates each unlock once", () => {
    const stats = computeHabitStats(pillboxWithCompleteDays(["2026-10-01"]), [], noonLima("2026-10-01"));
    const { progress } = evaluateRewards([reward("dia-1", { type: "completeDays", total: 1 })], stats, EMPTY_REWARD_PROGRESS, "2026-10-01");
    expect(pendingCelebrations(progress).map((item) => item.key)).toEqual(["dia-1"]);
    expect(pendingCelebrations(markCelebrated(progress, ["dia-1"]))).toEqual([]);
  });
});

describe("migrateRewardProgress", () => {
  it("accepts the current version and upgrades an unversioned save without re-celebrating", () => {
    expect(migrateRewardProgress(EMPTY_REWARD_PROGRESS)).toEqual(EMPTY_REWARD_PROGRESS);
    const legacy = { unlocked: [{ rewardId: "primer-dia", key: "primer-dia", unlockedOn: "2026-10-01" }] };
    expect(migrateRewardProgress(legacy)).toEqual({ version: 1, unlocked: legacy.unlocked, celebratedKeys: ["primer-dia"] });
  });

  it("returns null for unknown data so the store keeps the original untouched", () => {
    expect(migrateRewardProgress({ version: 99 })).toBeNull();
    expect(migrateRewardProgress("basura")).toBeNull();
  });
});
