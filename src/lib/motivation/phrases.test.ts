import { describe, expect, it } from "vitest";
import { findForbiddenPhrases } from "../clinical/forbiddenCopy";
import { addDaysToIsoDate } from "../utils/date";
import {
  MAX_PHRASE_LENGTH,
  MOTIVATION_CATEGORIES,
  MOTIVATIONAL_PHRASES,
  NO_REPEAT_WINDOW_DAYS,
  getMotivationalPhrase,
} from "./phrases";

const MIN_UNIQUE_PHRASES = 50;

function limaNoon(isoDate: string): Date {
  return new Date(`${isoDate}T17:00:00.000Z`);
}

function phrasesForDays(start: string, count: number, offset = 0): string[] {
  return Array.from({ length: count }, (_, index) =>
    getMotivationalPhrase(limaNoon(addDaysToIsoDate(start, index)), offset).text
  );
}

describe("MOTIVATIONAL_PHRASES", () => {
  it(`has more than ${MIN_UNIQUE_PHRASES} unique phrases`, () => {
    const texts = MOTIVATIONAL_PHRASES.map((phrase) => phrase.text);
    expect(new Set(texts).size).toBe(texts.length);
    expect(texts.length).toBeGreaterThan(MIN_UNIQUE_PHRASES);
  });

  it("covers every category with at least five phrases", () => {
    for (const category of MOTIVATION_CATEGORIES) {
      const count = MOTIVATIONAL_PHRASES.filter((phrase) => phrase.category === category).length;
      expect(count, category).toBeGreaterThanOrEqual(5);
    }
  });

  it.each(MOTIVATIONAL_PHRASES.map((phrase) => [phrase.text]))("is short and kind: %s", (text) => {
    expect(text.length).toBeLessThanOrEqual(MAX_PHRASE_LENGTH);
    expect(findForbiddenPhrases(text)).toEqual([]);
    expect(text).not.toMatch(/T-?score|osteopenia|osteoporosis|dolor\s+\d|urgente|última oportunidad|deberías/i);
  });

  it("every phrase carries an emoji", () => {
    for (const { text } of MOTIVATIONAL_PHRASES) {
      expect(text, text).toMatch(/\p{Extended_Pictographic}/u);
    }
  });
});

describe("getMotivationalPhrase", () => {
  it("is deterministic within the same Lima day", () => {
    const morning = new Date("2026-10-09T13:00:00.000Z");
    const night = new Date("2026-10-10T04:30:00.000Z");
    expect(getMotivationalPhrase(morning)).toEqual(getMotivationalPhrase(night));
  });

  it(`never repeats within ${NO_REPEAT_WINDOW_DAYS} days, across a whole year`, () => {
    const phrases = phrasesForDays("2026-01-01", 380);
    phrases.forEach((text, index) => {
      const window = phrases.slice(Math.max(0, index - NO_REPEAT_WINDOW_DAYS + 1), index);
      expect(window).not.toContain(text);
    });
  });

  it("uses every phrase over one full cycle", () => {
    const phrases = phrasesForDays("2026-10-09", MOTIVATIONAL_PHRASES.length);
    expect(new Set(phrases).size).toBe(MOTIVATIONAL_PHRASES.length);
  });

  it("'Otra frase' offsets give a different phrase the same day", () => {
    const day = limaNoon("2026-10-09");
    const seen = [0, 1, 2, 3, 4].map((offset) => getMotivationalPhrase(day, offset).text);
    expect(new Set(seen).size).toBe(seen.length);
  });

  it("treats a negative or broken offset as zero", () => {
    const day = limaNoon("2026-10-09");
    expect(getMotivationalPhrase(day, -2)).toEqual(getMotivationalPhrase(day, 0));
    expect(getMotivationalPhrase(day, Number.NaN)).toEqual(getMotivationalPhrase(day, 0));
  });
});

describe("getMotivationalPhrase with a red flag", () => {
  it("never suggests movement while a red flag is active", () => {
    for (let index = 0; index < MOTIVATIONAL_PHRASES.length * 2; index += 1) {
      const day = limaNoon(addDaysToIsoDate("2026-01-01", index));
      expect(getMotivationalPhrase(day, 0, { hasRedFlag: true }).category).not.toBe("movimiento");
    }
  });
});
