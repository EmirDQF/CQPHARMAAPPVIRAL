import { describe, expect, it } from "vitest";
import {
  addDaysToIsoDate,
  lastNIsoDates,
  millisecondsUntilNextLimaTime,
  toLimaIsoDate,
} from "./date";

describe("toLimaIsoDate", () => {
  it("keeps a 23:30 Lima dose on the same local day (04:30 UTC next day)", () => {
    const lateNightInLima = new Date("2026-09-24T04:30:00Z");
    expect(toLimaIsoDate(lateNightInLima)).toBe("2026-09-23");
  });

  it("keeps the 21:30 night dose on the same local day", () => {
    expect(toLimaIsoDate(new Date("2026-09-24T02:30:00Z"))).toBe("2026-09-23");
  });

  it("rolls over at Lima midnight, not at UTC midnight", () => {
    expect(toLimaIsoDate(new Date("2026-09-24T04:59:59Z"))).toBe("2026-09-23");
    expect(toLimaIsoDate(new Date("2026-09-24T05:00:00Z"))).toBe("2026-09-24");
  });

  it("handles new year's eve in Lima", () => {
    expect(toLimaIsoDate(new Date("2027-01-01T03:00:00Z"))).toBe("2026-12-31");
  });
});

describe("addDaysToIsoDate", () => {
  it("crosses month, year and leap-day boundaries", () => {
    expect(addDaysToIsoDate("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDaysToIsoDate("2027-01-01", -1)).toBe("2026-12-31");
    expect(addDaysToIsoDate("2028-03-01", -1)).toBe("2028-02-29");
  });
});

describe("lastNIsoDates", () => {
  it("returns N Lima dates ending today, most recent first", () => {
    const lateNightInLima = new Date("2026-09-24T04:30:00Z");
    expect(lastNIsoDates(3, lateNightInLima)).toEqual([
      "2026-09-23",
      "2026-09-22",
      "2026-09-21",
    ]);
  });
});

describe("millisecondsUntilNextLimaTime", () => {
  const MINUTE_MS = 60_000;

  it("waits until later today in Lima when the time has not passed", () => {
    const eightAmLima = new Date("2026-09-23T13:00:00Z");
    expect(millisecondsUntilNextLimaTime("08:30", eightAmLima)).toBe(30 * MINUTE_MS);
  });

  it("waits until tomorrow in Lima when the time already passed", () => {
    const tenPmLima = new Date("2026-09-24T03:00:00Z");
    expect(millisecondsUntilNextLimaTime("21:30", tenPmLima)).toBe(23.5 * 60 * MINUTE_MS);
  });

  it("schedules a full day ahead when called exactly at the dose time", () => {
    const exactlyEightThirtyLima = new Date("2026-09-23T13:30:00Z");
    expect(millisecondsUntilNextLimaTime("08:30", exactlyEightThirtyLima)).toBe(
      24 * 60 * MINUTE_MS
    );
  });
});
