import { describe, expect, it } from "vitest";
import { findForbiddenPhrases } from "../clinical/forbiddenCopy";
import { addDaysToIsoDate } from "../utils/date";
import {
  DAILY_PHRASES,
  buildDailyReinforcementMessage,
  getDailyPhrase,
} from "./reinforcementMessage";

const MIN_UNIQUE_PHRASES = 50;
const STREAKS = [0, 1, 2, 5, 10, 20, 45, 365];

/** Mediodía de Lima (UTC-5) del día ISO indicado. */
function limaNoon(isoDate: string): Date {
  return new Date(`${isoDate}T17:00:00.000Z`);
}

function consecutiveDays(start: string, count: number): Date[] {
  return Array.from({ length: count }, (_, index) => limaNoon(addDaysToIsoDate(start, index)));
}

describe("DAILY_PHRASES", () => {
  it(`has at least ${MIN_UNIQUE_PHRASES} unique phrases`, () => {
    expect(new Set(DAILY_PHRASES).size).toBe(DAILY_PHRASES.length);
    expect(DAILY_PHRASES.length).toBeGreaterThanOrEqual(MIN_UNIQUE_PHRASES);
  });

  it.each(DAILY_PHRASES.map((phrase) => [phrase]))(
    "never uses cure claims, product names or guilt: %s",
    (phrase) => {
      expect(findForbiddenPhrases(phrase)).toEqual([]);
    }
  );
});

describe("getDailyPhrase", () => {
  it("is deterministic for the same Lima date", () => {
    const morning = new Date("2026-10-09T13:00:00.000Z"); // 08:00 Lima
    const night = new Date("2026-10-10T04:30:00.000Z"); // 23:30 Lima del 9
    expect(getDailyPhrase(morning)).toBe(getDailyPhrase(night));
  });

  it("changes at Lima midnight, not UTC midnight", () => {
    const beforeLimaMidnight = new Date("2026-10-10T04:59:00.000Z"); // 23:59 Lima del 9
    const afterLimaMidnight = new Date("2026-10-10T05:01:00.000Z"); // 00:01 Lima del 10
    expect(getDailyPhrase(beforeLimaMidnight)).not.toBe(getDailyPhrase(afterLimaMidnight));
  });

  it("rotates to a different phrase on every pair of consecutive days", () => {
    const phrases = consecutiveDays("2026-01-01", 400).map((day) => getDailyPhrase(day));
    phrases.slice(1).forEach((phrase, index) => {
      expect(phrase).not.toBe(phrases[index]);
    });
  });

  it("uses every phrase over one full cycle", () => {
    const phrases = consecutiveDays("2026-10-09", DAILY_PHRASES.length).map((day) =>
      getDailyPhrase(day)
    );
    expect(new Set(phrases).size).toBe(DAILY_PHRASES.length);
  });
});

describe("buildDailyReinforcementMessage", () => {
  const today = limaNoon("2026-10-09");

  it.each(STREAKS)("streak %i passes the forbidden copy check", (streakDays) => {
    expect(findForbiddenPhrases(buildDailyReinforcementMessage(streakDays, today))).toEqual([]);
  });

  it("shows the streak motto in plural and singular", () => {
    expect(buildDailyReinforcementMessage(3, today)).toContain("3 días cuidando tu movilidad");
    expect(buildDailyReinforcementMessage(1, today)).toContain("1 día cuidando tu movilidad");
  });

  it("invites to start without a streak and without guilt", () => {
    const message = buildDailyReinforcementMessage(0, today);
    expect(message).not.toMatch(/\d+ días? cuidando/);
    expect(message).toContain(getDailyPhrase(today));
  });

  it.each([-3, Number.NaN, Number.POSITIVE_INFINITY])(
    "treats an invalid streak (%s) as no streak",
    (streakDays) => {
      expect(buildDailyReinforcementMessage(streakDays, today)).toBe(
        buildDailyReinforcementMessage(0, today)
      );
    }
  );

  it("rounds partial streaks down", () => {
    expect(buildDailyReinforcementMessage(2.9, today)).toContain("2 días cuidando tu movilidad");
  });

  it("carries the same daily phrase for any streak length", () => {
    const phrase = getDailyPhrase(today);
    for (const streakDays of STREAKS) {
      expect(buildDailyReinforcementMessage(streakDays, today)).toContain(phrase);
    }
  });

  it("keeps the one-argument signature used by DailyReinforcementBanner", () => {
    expect(buildDailyReinforcementMessage(4)).toContain(getDailyPhrase());
  });
});

describe("'Otra frase'", () => {
  const today = limaNoon("2026-10-09");

  it("changes the phrase but keeps the streak motto", () => {
    const first = buildDailyReinforcementMessage(3, today);
    const next = buildDailyReinforcementMessage(3, today, { offset: 1 });
    expect(next).not.toBe(first);
    expect(next).toContain("3 días cuidando tu movilidad");
  });
});
