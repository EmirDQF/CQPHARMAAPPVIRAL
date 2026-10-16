import { describe, expect, it } from "vitest";
import { MYTH_OPTIONS, PLATE_CHOICES, memoryDeck, mythCards, plateFoods, quizCards, shieldCards } from "./gameRounds";
import { RHEUMA_EDUCATION } from "./rheumaEducationData";

describe("game rounds", () => {
  it("myths: the right answer matches the evidence and rounds grow with the level", () => {
    const cards = mythCards(1, 3);
    expect(cards).toHaveLength(6);
    for (const card of cards) {
      const item = RHEUMA_EDUCATION.myths.find((myth) => myth.id === card.id);
      expect(card.correct).toBe(item?.isFact ? MYTH_OPTIONS.fact : MYTH_OPTIONS.myth);
    }
    expect(mythCards(3, 3)).toHaveLength(10);
  });

  it("shield offers the three groups and the correct one for each card", () => {
    const [card] = shieldCards(1, 1);
    expect(card.options).toHaveLength(3);
    expect(card.options).toContain(card.correct);
  });

  it("quiz only uses questions up to the current level and keeps the right answer among shuffled options", () => {
    const easy = quizCards(1, 9);
    const levelOneIds = new Set(RHEUMA_EDUCATION.quiz.filter((item) => item.level === 1).map((item) => item.id));
    expect(easy.every((card) => levelOneIds.has(card.id))).toBe(true);
    easy.forEach((card) => expect(card.options).toContain(card.correct));
    expect(quizCards(3, 9).length).toBeGreaterThan(easy.length);
  });

  it("plate offers enough good foods to fill the plate", () => {
    const foods = plateFoods(5);
    expect(foods).toHaveLength(PLATE_CHOICES);
    expect(foods.filter((food) => food.nutrient !== "poco").length).toBeGreaterThanOrEqual(4);
  });

  it("memory deals two cards per pair, more pairs at higher levels", () => {
    const deck = memoryDeck(1, 2);
    expect(deck.cards).toHaveLength(deck.pairs.length * 2);
    expect(memoryDeck(3, 2).pairs.length).toBeGreaterThan(deck.pairs.length);
  });
});
