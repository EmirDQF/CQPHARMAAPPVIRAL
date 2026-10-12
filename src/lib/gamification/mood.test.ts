import { describe, expect, it } from "vitest";
import { ACTIVITY_CATALOG } from "../activities/catalog";
import { findForbiddenPhrases } from "../clinical/forbiddenCopy";
import { isReturningAfterBreak, pickArtikoMood, type MoodInput } from "./mood";

// 10:00 en Lima (UTC-5).
const MORNING = new Date("2026-10-11T15:00:00Z");
const BASE: MoodInput = {
  now: MORNING,
  today: "2026-10-11",
  hasRedFlag: false,
  goalMet: false,
  streakDays: 0,
  lastOpenedOn: "2026-10-10",
  nextMission: ACTIVITY_CATALOG[0],
};
const GUILT = /perd|fall|deber|culpa|rompi|última oportunidad|apúrate/i;

describe("pickArtikoMood", () => {
  it("greets with the next mission on opening", () => {
    expect(pickArtikoMood(BASE)).toEqual({ emotion: "happy", message: "¡Hola! ☀️ Tu siguiente misión: ☀️ Chequeo de la mañana." });
  });

  it("puts the rheumatology evaluation first with a red flag, ahead of any goal", () => {
    const mood = pickArtikoMood({ ...BASE, hasRedFlag: true, goalMet: true, streakDays: 10 });
    expect(mood.emotion).toBe("waiting");
    expect(mood.message).toMatch(/reumatólogo/);
  });

  it("flexes when the daily goal is met", () => {
    expect(pickArtikoMood({ ...BASE, goalMet: true }).emotion).toBe("flexing");
  });

  it("welcomes back warmly after 3+ days away, without guilt", () => {
    const mood = pickArtikoMood({ ...BASE, lastOpenedOn: "2026-10-07", streakDays: 0 });
    expect(mood.emotion).toBe("welcome");
    expect(mood.message).toMatch(/Qué bueno verte/);
    expect(isReturningAfterBreak("2026-10-09", "2026-10-11")).toBe(false);
    expect(isReturningAfterBreak(null, "2026-10-11")).toBe(false);
  });

  it("shows the streak flame from 3 active days", () => {
    expect(pickArtikoMood({ ...BASE, streakDays: 3 }).emotion).toBe("fire_streak");
  });

  it("gives a friendly heads-up in the evening and rests at night", () => {
    expect(pickArtikoMood({ ...BASE, now: new Date("2026-10-11T23:30:00Z") }).emotion).toBe("heads_up");
    expect(pickArtikoMood({ ...BASE, now: new Date("2026-10-12T03:30:00Z") }).emotion).toBe("sleepy");
  });

  it("never uses guilt, urgency or forbidden copy in any message", () => {
    const variants: MoodInput[] = [
      BASE,
      { ...BASE, hasRedFlag: true },
      { ...BASE, goalMet: true },
      { ...BASE, lastOpenedOn: "2026-09-01" },
      { ...BASE, streakDays: 12 },
      { ...BASE, now: new Date("2026-10-11T23:30:00Z"), nextMission: null },
      { ...BASE, now: new Date("2026-10-12T03:30:00Z") },
    ];
    variants.forEach((input) => {
      const { message } = pickArtikoMood(input);
      expect(message).not.toMatch(GUILT);
      expect(findForbiddenPhrases(message)).toEqual([]);
    });
  });
});
