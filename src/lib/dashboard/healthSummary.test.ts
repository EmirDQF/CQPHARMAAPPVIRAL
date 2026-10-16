import { describe, expect, it } from "vitest";
import { DOSE_SCHEDULE } from "../clinical/constants";
import { adherencePercent, pickNextBestAction, stiffnessCounts, type NextBestActionInput } from "./healthSummary";
import type { PainLogEntry } from "./types";

const NOW = new Date("2026-10-16T17:00:00.000Z");
const ALL_DOSES = DOSE_SCHEDULE.map((dose) => dose.id);

const entry = (date: string, stiffness: PainLogEntry["stiffness"]): PainLogEntry => ({ date, painLevel: 3, stiffness });

describe("adherencePercent (solo lo registrado)", () => {
  it("is 0 without records and 100 with every dose of every day", () => {
    expect(adherencePercent({}, NOW, 7)).toBe(0);
    const full = Object.fromEntries(
      ["2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16"].map((date) => [date, ALL_DOSES])
    );
    expect(adherencePercent(full, NOW, 7)).toBe(100);
  });

  it("ignores unknown dose ids and days outside the window", () => {
    const records = { "2026-10-16": [ALL_DOSES[0], "otra"], "2026-09-01": ALL_DOSES };
    expect(adherencePercent(records, NOW, 7)).toBe(Math.round((1 / (7 * ALL_DOSES.length)) * 100));
  });
});

describe("stiffnessCounts", () => {
  it("counts only the recorded days within the range", () => {
    const counts = stiffnessCounts([entry("2026-10-16", "0-15"), entry("2026-10-15", "30+"), entry("2026-08-01", "30+")], 7, NOW);
    expect(counts).toEqual({ "0-15": 1, "15-30": 0, "30+": 1 });
  });
});

describe("pickNextBestAction", () => {
  const base: NextBestActionInput = {
    hasRedFlag: false,
    hasBoneScan: true,
    checkedInToday: true,
    pendingDoseNow: false,
    learnedToday: true,
  };

  it("puts the rheumatology evaluation first when there is a red flag", () => {
    expect(pickNextBestAction({ ...base, hasRedFlag: true, checkedInToday: false }).id).toBe("evaluacion");
  });

  it.each([
    [{ pendingDoseNow: true }, "toma"],
    [{ checkedInToday: false }, "chequeo"],
    [{ hasBoneScan: false }, "densitometria"],
    [{ learnedToday: false }, "aprender"],
  ] as const)("%j → %s", (overrides, expected) => {
    expect(pickNextBestAction({ ...base, ...overrides }).id).toBe(expected);
  });

  it("celebrates calmly when everything is done", () => {
    expect(pickNextBestAction(base).id).toBe("descanso");
  });
});
