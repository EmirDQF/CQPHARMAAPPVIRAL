import { describe, expect, it } from "vitest";
import { LESSONS } from "../learn/lessons";
import { withLearningCompleted } from "./learning";
import { unlocksAfterLearning } from "./learningUnlocks";
import { MINI_GAME_IDS } from "./miniGames";
import { EMPTY_GAME_PROGRESS, type GameProgress } from "./progress";
import { GAME_UNLOCKS } from "./unlocks";

const TODAY = "2026-10-16";

function learn(keys: readonly string[]): GameProgress {
  return keys.reduce((progress, key) => {
    const [kind, id] = key.split(":") as ["lesson" | "game", string];
    return withLearningCompleted(progress, kind, id, TODAY).progress;
  }, EMPTY_GAME_PROGRESS);
}

const sources = (progress: GameProgress) => ({ pillbox: { takenDoseIdsByDate: {} }, painEntries: [], progress });

describe("learning badges", () => {
  it("every badge key points to a real, non-physical lesson or an existing game", () => {
    const lessons = new Map(LESSONS.map((lesson) => [lesson.id, lesson]));
    const keys = GAME_UNLOCKS.flatMap((unlock) => (unlock.rule.type === "learningSet" ? unlock.rule.keys : []));
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      const [kind, id] = key.split(":");
      if (kind === "lesson") expect(lessons.get(id)?.physical, key).toBe(false);
      else expect(MINI_GAME_IDS).toContain(id);
    }
  });

  it("unlocks 'Experto en Densitometría' after both DMO lessons and marks it celebrated", () => {
    const { unlocked, progress } = unlocksAfterLearning(sources(learn(["lesson:que-es-la-dmo", "lesson:como-leer-el-t-score"])), TODAY, 3);
    expect(unlocked.map((unlock) => unlock.title)).toContain("Experto en Densitometría");
    expect(progress.celebratedKeys).toContain("experto-densitometria");
  });

  it("does not unlock a set badge with only part of it", () => {
    const { unlocked } = unlocksAfterLearning(sources(learn(["lesson:que-es-la-dmo"])), TODAY, 3);
    expect(unlocked.map((unlock) => unlock.id)).not.toContain("experto-densitometria");
  });

  it("gives Artiko the medal after five lessons, and never twice", () => {
    const five = learn(["gota", "lumbalgia", "fibromialgia", "rigidez-matutina", "menopausia-y-huesos"].map((id) => `lesson:${id}`));
    const first = unlocksAfterLearning(sources(five), TODAY, 3);
    expect(first.unlocked.find((unlock) => unlock.id === "mente-curiosa")?.accessory).toBe("medal");
    const again = unlocksAfterLearning(sources(first.progress), TODAY, 3);
    expect(again.unlocked).toEqual([]);
  });

  it("badges only reward learning or consistency, never a clinical value or a purchase", () => {
    const text = JSON.stringify(GAME_UNLOCKS);
    expect(text).not.toMatch(/compra|descuento|T-score de|dolor (bajó|menor)/i);
  });
});

describe("badge copy", () => {
  it("still rejects brands and cure promises", async () => {
    const { gameUnlockSchema } = await import("./unlocks");
    const base = GAME_UNLOCKS[0];
    expect(gameUnlockSchema.safeParse({ ...base, title: "Fan de CQ Pharma" }).success).toBe(false);
    expect(gameUnlockSchema.safeParse({ ...base, description: "Esto cura tus huesos" }).success).toBe(false);
  });
});
