import { describe, expect, it } from "vitest";
import {
  buildDayProgress,
  doseSlotStatus,
  formatLimaLongDate,
  limaGreeting,
  suggestNextAction,
  type NextActionInput,
} from "./myDay";

// Lima = UTC-5 todo el año.
const at = (limaTime: string, date = "2026-10-11") => new Date(`${date}T${limaTime}:00-05:00`);

describe("limaGreeting", () => {
  it("greets by the Lima clock, not the phone's time zone", () => {
    expect(limaGreeting(at("07:00"))).toBe("Buenos días");
    expect(limaGreeting(at("12:00"))).toBe("Buenas tardes");
    expect(limaGreeting(at("19:00"))).toBe("Buenas noches");
    expect(limaGreeting(at("02:00"))).toBe("Buenas noches");
  });
});

describe("formatLimaLongDate", () => {
  it("formats the Lima calendar day in Spanish", () => {
    // 23:30 en Lima = 04:30 UTC del día siguiente: sigue siendo domingo 11 en Lima.
    expect(formatLimaLongDate(at("23:30"))).toBe("domingo, 11 de octubre");
  });
});

describe("doseSlotStatus", () => {
  it("is taken, due once its Lima time arrives, or upcoming before", () => {
    expect(doseSlotStatus("08:30", true, at("07:00"))).toBe("taken");
    expect(doseSlotStatus("08:30", false, at("08:30"))).toBe("due");
    expect(doseSlotStatus("21:30", false, at("12:00"))).toBe("upcoming");
  });
});

describe("buildDayProgress", () => {
  it("counts each scheduled dose once plus the daily check-in", () => {
    expect(buildDayProgress(["morning-collagen"], false)).toEqual({ done: 1, total: 3, ratio: 1 / 3 });
    expect(buildDayProgress(["morning-collagen", "night-magnesium"], true)).toEqual({ done: 3, total: 3, ratio: 1 });
  });

  it("ignores duplicate or unknown dose ids so extra taps never inflate the day", () => {
    expect(buildDayProgress(["morning-collagen", "morning-collagen", "otra"], false).done).toBe(1);
  });
});

describe("suggestNextAction", () => {
  const base: NextActionInput = {
    hasRedFlag: false,
    takenDoseIds: [],
    checkInDone: false,
    hasBoneScan: true,
    now: at("09:00"),
  };

  it("puts the rheumatology evaluation above everything when a red flag is active", () => {
    expect(suggestNextAction({ ...base, hasRedFlag: true })).toEqual({ kind: "red-flag" });
  });

  it("suggests the dose whose time already arrived", () => {
    expect(suggestNextAction(base)).toEqual({ kind: "take-dose", doseId: "morning-collagen", time: "08:30" });
  });

  it("then the check-in, then the next upcoming dose", () => {
    const morningDone = { ...base, takenDoseIds: ["morning-collagen"] };
    expect(suggestNextAction(morningDone)).toEqual({ kind: "check-in" });
    expect(suggestNextAction({ ...morningDone, checkInDone: true })).toEqual({
      kind: "upcoming-dose",
      doseId: "night-magnesium",
      time: "21:30",
    });
  });

  it("invites to register a densitometry only when everything for today is done", () => {
    const allDone = { ...base, takenDoseIds: ["morning-collagen", "night-magnesium"], checkInDone: true };
    expect(suggestNextAction({ ...allDone, hasBoneScan: false })).toEqual({ kind: "register-dexa" });
    expect(suggestNextAction(allDone)).toEqual({ kind: "all-done" });
  });
});
