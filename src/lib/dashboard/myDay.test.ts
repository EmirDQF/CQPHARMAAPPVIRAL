import { describe, expect, it } from "vitest";
import { doseSlotStatus, formatLimaLongDate, limaGreeting } from "./myDay";

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
