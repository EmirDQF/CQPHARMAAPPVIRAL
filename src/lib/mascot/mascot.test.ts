import { describe, expect, it } from "vitest";
import { findForbiddenPhrases } from "../clinical/forbiddenCopy";
import { ARTIKO_EMOTIONS, ARTIKO_POSES, MASCOT, artikoLabel } from "./mascot";

const DISTRESS = /llor|lágrim|trist|tembl|enoj|decepcion|castig/i;

describe("Artiko", () => {
  it("is named in a single constant", () => {
    expect(MASCOT.name).toBe("Artiko");
  });

  it.each(ARTIKO_EMOTIONS)("%s has a pose and a friendly, accessible label", (emotion) => {
    const label = artikoLabel(emotion);
    expect(ARTIKO_POSES[emotion]).toBeDefined();
    expect(label.startsWith(MASCOT.name)).toBe(true);
    expect(label).not.toMatch(DISTRESS);
    expect(findForbiddenPhrases(label)).toEqual([]);
  });

  it("never tilts more than a gentle, curious angle", () => {
    ARTIKO_EMOTIONS.forEach((emotion) => expect(Math.abs(ARTIKO_POSES[emotion].tilt)).toBeLessThanOrEqual(10));
  });

  it("mentions the accessories Artiko is wearing", () => {
    expect(artikoLabel("happy", ["cap", "glasses"])).toBe("Artiko sonríe contento, con gorra deportiva y lentes");
  });
});
