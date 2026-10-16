import { describe, expect, it } from "vitest";
import { findForbiddenPhrases } from "../clinical/forbiddenCopy";
import { CONTENT_SOURCES } from "../learn/schemas";
import {
  EMPTY_MINI_GAME_SCORES,
  MINI_GAMES,
  nextLevel,
  roundSize,
  seededShuffle,
  visibleGames,
  withGameResult,
} from "./miniGames";
import { RHEUMA_EDUCATION, educationItemCount } from "./rheumaEducationData";
import { rheumaEducationSchema } from "./rheumaEducationSchemas";

const ALL_ITEMS = [
  ...RHEUMA_EDUCATION.myths,
  ...RHEUMA_EDUCATION.shield,
  ...RHEUMA_EDUCATION.plate,
  ...RHEUMA_EDUCATION.home,
  ...RHEUMA_EDUCATION.memory,
  ...RHEUMA_EDUCATION.quiz,
];

describe("rheumaEducationData", () => {
  it("has at least 60 items, each with an explanation, a source and pending review", () => {
    expect(educationItemCount()).toBeGreaterThanOrEqual(60);
    for (const item of ALL_ITEMS) {
      expect(item.explanation.length).toBeGreaterThan(0);
      expect(CONTENT_SOURCES).toContain(item.source);
      expect(item.reviewStatus).toBe("pendiente");
    }
  });

  it("never promises cure, uses doses or blames", () => {
    const text = JSON.stringify(RHEUMA_EDUCATION);
    expect(findForbiddenPhrases(text, { categories: ["cura-reversion", "culpa-miedo"] })).toEqual([]);
    expect(text).not.toMatch(/\d+\s*(mg|UI|mcg)\b/i);
  });

  it("keeps the exact WHO rule: -2.5 is osteoporosis", () => {
    const item = RHEUMA_EDUCATION.quiz.find((question) => question.id === "menos-dos-cinco");
    expect(item?.options[item.answerIndex]).toBe("Osteoporosis");
  });

  it("rejects duplicated ids at load time", () => {
    const broken = { ...RHEUMA_EDUCATION, myths: [...RHEUMA_EDUCATION.myths, RHEUMA_EDUCATION.myths[0]] };
    expect(rheumaEducationSchema.safeParse(broken).success).toBe(false);
  });

  it("the home has risks to find and safe examples", () => {
    expect(RHEUMA_EDUCATION.home.filter((spot) => spot.isRisk).length).toBeGreaterThanOrEqual(5);
    expect(RHEUMA_EDUCATION.home.some((spot) => !spot.isRisk)).toBe(true);
  });
});

describe("mini-game rules", () => {
  it("offers six games and hides the ones that suggest movement with a red flag", () => {
    expect(MINI_GAMES).toHaveLength(6);
    expect(visibleGames(true).some((game) => game.suggestsMovement)).toBe(false);
    expect(visibleGames(false)).toHaveLength(6);
  });

  it("levels up only after a strong round and never goes down", () => {
    expect(nextLevel(1, 8, 10)).toBe(2);
    expect(nextLevel(2, 3, 10)).toBe(2);
    expect(nextLevel(3, 10, 10)).toBe(3);
    expect(nextLevel(1, 0, 0)).toBe(1);
  });

  it("grows the round with the level but never beyond the content", () => {
    expect(roundSize(1, 5, 2, 18)).toBe(5);
    expect(roundSize(3, 5, 2, 18)).toBe(9);
    expect(roundSize(3, 5, 10, 8)).toBe(8);
  });

  it("shuffles deterministically without mutating", () => {
    const items = [1, 2, 3, 4, 5];
    expect(seededShuffle(items, 7)).toEqual(seededShuffle(items, 7));
    expect([...seededShuffle(items, 7)].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5]);
  });

  it("keeps the best score by ratio and stores the next level", () => {
    const first = withGameResult(EMPTY_MINI_GAME_SCORES, "quiz-reumatologia", { correct: 4, total: 5 });
    const worse = withGameResult(first, "quiz-reumatologia", { correct: 1, total: 5 });
    expect(worse.best["quiz-reumatologia"]).toEqual({ correct: 4, total: 5 });
    expect(worse.level["quiz-reumatologia"]).toBe(2);
  });
});
