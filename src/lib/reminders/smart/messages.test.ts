import { describe, expect, it } from "vitest";
import { findForbiddenPhrases } from "../../clinical/forbiddenCopy";
import { addDaysToIsoDate } from "../../utils/date";
import { NUDGE_MESSAGES, NUDGE_SLOTS, PAUSE_MESSAGE, fillStreak, pickNudgeMessage } from "./messages";

/** Lo que nunca debe verse en una pantalla bloqueada: términos de salud, productos o valores. */
const HEALTH_TERMS =
  /dolor|rigidez|c[aá]psula|col[aá]geno|magnesio|vitamina|calcio|suplement|pastilla|medicament|hueso|[oó]se[oa]|osteo|densitometr|articula|t-score|reumat|tratamiento|toma\b|tomas\b|dosis|diagn[oó]stic/i;
const GUILT = /perder[aá]s|no falles|no rompas|te olvidaste|abandon|decepcion|última oportunidad|urgente|apúrate|ya mismo|culpa/i;

const ALL = [...NUDGE_SLOTS.flatMap((slot) => NUDGE_MESSAGES[slot]), PAUSE_MESSAGE];

describe("nudge messages", () => {
  it("has at least 25 variants", () => {
    expect(ALL.length).toBeGreaterThanOrEqual(25);
    expect(new Set(ALL.map((message) => message.id)).size).toBe(ALL.length);
  });

  it.each(ALL.map((message) => [message.id, message] as const))("%s is generic, kind and allowed", (_id, message) => {
    const text = `${message.title} ${fillStreak(message.body, 12)}`;
    expect(text).not.toMatch(HEALTH_TERMS);
    expect(text).not.toMatch(GUILT);
    expect(findForbiddenPhrases(text)).toEqual([]);
    expect(text).not.toMatch(/\{|\}/);
  });

  it.each(NUDGE_SLOTS)("never repeats a %s message within 7 days", (slot) => {
    const ids = Array.from({ length: 7 }, (_, index) => pickNudgeMessage(slot, addDaysToIsoDate("2026-10-11", index), 3).id);
    expect(new Set(ids).size).toBe(7);
  });

  it("does not mention a streak that does not exist yet", () => {
    expect(fillStreak("Tu racha de {streak} días 🔥", 0)).not.toMatch(/racha de 0/);
    expect(fillStreak("Tu racha de {streak} días 🔥", 5)).toBe("Tu racha de 5 días 🔥");
  });
});
