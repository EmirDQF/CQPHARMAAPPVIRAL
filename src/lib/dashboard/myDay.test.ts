import { describe, expect, it } from "vitest";
import { doseSlotStatus, formatLimaLongDate, formatMinutesUntil, limaGreeting, nextUpcomingDose } from "./myDay";

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

describe("nextUpcomingDose y formatMinutesUntil", () => {
  const schedule = [
    { id: "a", time: "08:30" },
    { id: "b", time: "21:30" },
  ];
  // 13:00 UTC = 08:00 en Lima.
  const morning = new Date("2026-10-12T13:00:00Z");

  it("devuelve la siguiente toma por llegar", () => {
    expect(nextUpcomingDose(schedule, [], morning)).toEqual({ doseId: "a", minutesUntil: 30 });
  });

  it("salta lo ya tomado y devuelve null cuando no queda nada por llegar", () => {
    expect(nextUpcomingDose(schedule, ["a"], morning)).toEqual({ doseId: "b", minutesUntil: 810 });
    expect(nextUpcomingDose(schedule, ["a", "b"], morning)).toBeNull();
    // 03:00 UTC del 13 = 22:00 en Lima: ya pasaron las dos.
    expect(nextUpcomingDose(schedule, [], new Date("2026-10-13T03:00:00Z"))).toBeNull();
  });

  it("formatea minutos y horas", () => {
    expect(formatMinutesUntil(25)).toBe("en 25 min");
    expect(formatMinutesUntil(180)).toBe("en 3 h");
    expect(formatMinutesUntil(135)).toBe("en 2 h 15 min");
  });
});
