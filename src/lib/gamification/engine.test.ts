import { describe, expect, it } from "vitest";
import { ACTIVITY_CATALOG } from "../activities/catalog";
import { selectDailyMissions } from "../activities/rotation";
import type { PainLogEntry, PillboxState } from "../dashboard/types";
import {
  activeDays,
  completedOn,
  computeGameStats,
  dailyGoalStatus,
  evaluateUnlocks,
  levelFromXp,
  unlockedAccessories,
  weekStartOf,
  type GameSources,
} from "./engine";
import {
  EMPTY_GAME_PROGRESS,
  parseGameProgress,
  withActivityCompleted,
  withActivityUndone,
  type GameProgress,
} from "./progress";
import { GAME_UNLOCKS } from "./unlocks";

const TODAY = "2026-10-11";
const EMPTY_PILLBOX: PillboxState = { takenDoseIdsByDate: {} };

function sources(overrides: Partial<GameSources> = {}): GameSources {
  return { pillbox: EMPTY_PILLBOX, painEntries: [], progress: EMPTY_GAME_PROGRESS, ...overrides };
}

function progressWith(entries: Record<string, string[]>): GameProgress {
  return Object.entries(entries).reduce(
    (progress, [date, ids]) => ids.reduce((acc, id) => withActivityCompleted(acc, id, date), progress),
    EMPTY_GAME_PROGRESS
  );
}

describe("completion and XP", () => {
  it("derives doses and check-in from the existing pillbox and pain diary (single source of truth)", () => {
    const painEntries: PainLogEntry[] = [{ date: TODAY, painLevel: 9, stiffness: "30+" }];
    const pillbox: PillboxState = { takenDoseIdsByDate: { [TODAY]: ["morning-collagen"] } };
    expect([...completedOn(ACTIVITY_CATALOG, sources({ pillbox, painEntries }), TODAY)].sort()).toEqual(["chequeo-matutino", "toma-manana"]);
  });

  it("gives XP once per activity and day, whatever the pain value", () => {
    const high: PainLogEntry[] = [{ date: TODAY, painLevel: 9, stiffness: "30+" }];
    const low: PainLogEntry[] = [{ date: TODAY, painLevel: 1, stiffness: "0-15" }];
    const twice = withActivityCompleted(withActivityCompleted(EMPTY_GAME_PROGRESS, "agua", TODAY), "agua", TODAY);
    const statsHigh = computeGameStats(ACTIVITY_CATALOG, sources({ painEntries: high, progress: twice }), TODAY, 5);
    const statsLow = computeGameStats(ACTIVITY_CATALOG, sources({ painEntries: low, progress: twice }), TODAY, 5);
    expect(statsHigh.xp).toBe(10 + 5);
    expect(statsLow.xp).toBe(statsHigh.xp);
  });

  it("ignores unknown activity ids and lets the person undo a mistaken tap", () => {
    const progress = withActivityUndone(progressWith({ [TODAY]: ["agua", "no-existe"] }), "agua", TODAY);
    expect(computeGameStats(ACTIVITY_CATALOG, sources({ progress }), TODAY, 5).xp).toBe(0);
  });

  it("levels up every 100 XP", () => {
    expect(levelFromXp(0)).toEqual({ level: 1, xpIntoLevel: 0, xpForLevel: 100 });
    expect(levelFromXp(250)).toEqual({ level: 3, xpIntoLevel: 50, xpForLevel: 100 });
  });
});

describe("daily goal", () => {
  it("is met when the day's missions reach the chosen goal", () => {
    const missions = selectDailyMissions({ catalog: ACTIVITY_CATALOG, date: TODAY, goal: 3, hasRedFlag: false });
    expect(dailyGoalStatus(missions, new Set(["chequeo-matutino", "toma-manana"]), 3)).toEqual({ done: 2, goal: 3, met: false });
    expect(dailyGoalStatus(missions, new Set(["chequeo-matutino", "toma-manana", "toma-noche", "agua"]), 3).met).toBe(true);
  });
});

describe("streak with grace days", () => {
  it("counts consecutive active Lima days and does not drop to 0 while today is pending", () => {
    const progress = progressWith({ "2026-10-08": ["agua"], "2026-10-09": ["agua"], "2026-10-10": ["agua"] });
    expect(computeGameStats(ACTIVITY_CATALOG, sources({ progress }), TODAY, 5).streak).toMatchObject({ days: 3, todayComplete: false });
  });

  it("uses an earned grace day instead of breaking the streak", () => {
    const week = Object.fromEntries(Array.from({ length: 7 }, (_, index) => [`2026-10-0${index + 1}`, ["agua"]]));
    const progress = progressWith({ ...week, "2026-10-09": ["agua"], "2026-10-10": ["agua"], [TODAY]: ["agua"] });
    const stats = computeGameStats(ACTIVITY_CATALOG, sources({ progress }), TODAY, 5);
    expect(stats.streak.shieldUsedOn).toBe("2026-10-08");
    expect(stats.streak.days).toBe(10);
  });

  it("restarts without taking away XP or unlocks", () => {
    const progress = progressWith({ "2026-10-01": ["agua"], [TODAY]: ["agua"] });
    const stats = computeGameStats(ACTIVITY_CATALOG, sources({ progress }), TODAY, 5);
    expect(stats.streak.days).toBe(1);
    expect(stats.xp).toBe(10);
  });
});

describe("weekly challenge", () => {
  it("uses Monday-to-Sunday Lima weeks", () => {
    expect(weekStartOf("2026-10-11")).toBe("2026-10-05");
    expect(weekStartOf("2026-10-05")).toBe("2026-10-05");
  });

  it("is done with 7 active days in the same week", () => {
    const week = Object.fromEntries(Array.from({ length: 7 }, (_, index) => [`2026-10-${String(5 + index).padStart(2, "0")}`, ["agua"]]));
    const stats = computeGameStats(ACTIVITY_CATALOG, sources({ progress: progressWith(week) }), TODAY, 5);
    expect(stats.week).toEqual({ weekStart: "2026-10-05", activeDays: 7, target: 7, done: true });
  });
});

describe("unlocks", () => {
  it("are idempotent and never removed", () => {
    const progress = progressWith({ "2026-10-09": ["agua"], "2026-10-10": ["agua"], [TODAY]: ["agua"] });
    const stats = computeGameStats(ACTIVITY_CATALOG, sources({ progress }), TODAY, 5);
    const first = evaluateUnlocks(GAME_UNLOCKS, stats, progress, TODAY);
    expect(first.newlyUnlocked.map((item) => item.unlockId)).toEqual(["primera-mision", "gorra-racha-3"]);
    const second = evaluateUnlocks(GAME_UNLOCKS, stats, first.progress, TODAY);
    expect(second.newlyUnlocked).toEqual([]);
    expect(second.progress).toBe(first.progress);
    expect(unlockedAccessories(GAME_UNLOCKS, first.progress)).toEqual(["cap"]);
  });

  it("can win 'Semana constante' once per week", () => {
    const week = Object.fromEntries(Array.from({ length: 7 }, (_, index) => [`2026-10-${String(5 + index).padStart(2, "0")}`, ["agua"]]));
    const progress = progressWith(week);
    const stats = computeGameStats(ACTIVITY_CATALOG, sources({ progress }), TODAY, 5);
    const keys = evaluateUnlocks(GAME_UNLOCKS, stats, progress, TODAY).newlyUnlocked.map((item) => item.key);
    expect(keys).toContain("semana-constante:2026-10-05");
  });
});

describe("game progress storage", () => {
  it("repairs broken fields and refuses unknown versions", () => {
    expect(parseGameProgress({ version: 1, completions: "x", equipped: ["cap", "crown"] })).toEqual({ ...EMPTY_GAME_PROGRESS });
    expect(parseGameProgress({ version: 2 })).toBeNull();
  });

  it("lists active days only up to today", () => {
    const progress = progressWith({ "2026-10-12": ["agua"], [TODAY]: ["agua"] });
    expect(activeDays(ACTIVITY_CATALOG, sources({ progress }), TODAY).map((day) => day.date)).toEqual([TODAY]);
  });
});
