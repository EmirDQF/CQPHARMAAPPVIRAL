import { describe, expect, it } from "vitest";
import { ACTIVITY_CATALOG } from "../activities/catalog";
import { computeGameStats } from "./engine";
import {
  DAILY_LEARNING_XP_CAP,
  LEARNING_XP,
  learnedKeys,
  learningXpOn,
  learningXpTotal,
  withLearningCompleted,
} from "./learning";
import { EMPTY_GAME_PROGRESS, parseGameProgress, type GameProgress } from "./progress";

const TODAY = "2026-10-16";

function complete(progress: GameProgress, items: readonly [("lesson" | "game"), string][], date = TODAY) {
  return items.reduce(
    (acc, [kind, id]) => {
      const result = withLearningCompleted(acc.progress, kind, id, date);
      return { progress: result.progress, awarded: [...acc.awarded, result.awardedXp] };
    },
    { progress, awarded: [] as number[] }
  );
}

describe("learning XP with a daily cap", () => {
  it("awards XP once per lesson or game per Lima day; replaying gives nothing more", () => {
    const { awarded } = complete(EMPTY_GAME_PROGRESS, [
      ["lesson", "gota"],
      ["lesson", "gota"],
      ["game", "mito-o-realidad"],
    ]);
    expect(awarded).toEqual([LEARNING_XP.lesson, 0, LEARNING_XP.game]);
  });

  it("never passes the daily cap, but the next day starts fresh", () => {
    const ids = ["gota", "lumbalgia", "fibromialgia", "postura-en-el-dia", "que-es-la-dmo", "sol-con-cuidado"];
    const today = complete(EMPTY_GAME_PROGRESS, ids.map((id) => ["lesson", id] as const));
    expect(today.awarded.reduce((sum, xp) => sum + xp, 0)).toBe(DAILY_LEARNING_XP_CAP);
    expect(learningXpOn(today.progress.learning[TODAY])).toBe(DAILY_LEARNING_XP_CAP);

    const tomorrow = complete(today.progress, [["lesson", "gota"]], "2026-10-17");
    expect(tomorrow.awarded).toEqual([LEARNING_XP.lesson]);
    expect(learningXpTotal(tomorrow.progress.learning, "2026-10-17")).toBe(DAILY_LEARNING_XP_CAP + LEARNING_XP.lesson);
  });

  it("adds learning XP to the game stats and counts the day as active for the grace streak", () => {
    const { progress } = complete(EMPTY_GAME_PROGRESS, [["lesson", "gota"]]);
    const stats = computeGameStats(ACTIVITY_CATALOG, { pillbox: { takenDoseIdsByDate: {} }, painEntries: [], progress }, TODAY, 3);
    expect(stats.xp).toBe(LEARNING_XP.lesson);
    expect(stats.activeDayCount).toBe(1);
    expect(stats.streak.days).toBe(1);
  });

  it("counts learning-only days in the weekly challenge", () => {
    const week = ["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18"];
    const progress = week.reduce((acc, date) => withLearningCompleted(acc, "lesson", "gota", date).progress, EMPTY_GAME_PROGRESS);
    const stats = computeGameStats(ACTIVITY_CATALOG, { pillbox: { takenDoseIdsByDate: {} }, painEntries: [], progress }, "2026-10-18", 3);
    expect(stats.week.done).toBe(true);
  });

  it("lists every distinct lesson or game ever completed", () => {
    const { progress } = complete(EMPTY_GAME_PROGRESS, [["lesson", "gota"], ["game", "casa-segura"]]);
    expect([...learnedKeys(progress.learning)]).toEqual(["lesson:gota", "game:casa-segura"]);
  });

  it("keeps old saved progress (without learning) readable", () => {
    const legacy: Record<string, unknown> = { ...EMPTY_GAME_PROGRESS };
    delete legacy.learning;
    expect(parseGameProgress(legacy)?.learning).toEqual({});
  });
});
