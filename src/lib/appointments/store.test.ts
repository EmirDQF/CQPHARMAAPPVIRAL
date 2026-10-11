import { describe, expect, it } from "vitest";
import { getNextUpcomingAppointment, getPastAppointments, getUpcomingAppointments } from "./store";
import type { Appointment } from "./types";

function makeAppointment(code: string, date: string, slot: Appointment["slot"] = "manana"): Appointment {
  return {
    code,
    serviceId: "densitometria",
    date,
    slot,
    patient: { name: "Ana", age: 60, phone: "999999999", bookedBy: "propia" },
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

// 12:00 en Lima (UTC-5) del 15 de octubre de 2026.
const NOW = new Date("2026-10-15T17:00:00.000Z");

describe("appointment views", () => {
  const appointments = [
    makeAppointment("PAST-OLD", "2026-09-01"),
    makeAppointment("NEXT-PM", "2026-10-20", "tarde"),
    makeAppointment("TODAY", "2026-10-15"),
    makeAppointment("NEXT-AM", "2026-10-20", "manana"),
    makeAppointment("PAST-RECENT", "2026-10-14"),
  ];

  it("lists upcoming appointments (today included) soonest first", () => {
    const codes = getUpcomingAppointments(appointments, NOW).map((appointment) => appointment.code);
    expect(codes).toEqual(["TODAY", "NEXT-AM", "NEXT-PM"]);
  });

  it("lists past appointments most recent first", () => {
    const codes = getPastAppointments(appointments, NOW).map((appointment) => appointment.code);
    expect(codes).toEqual(["PAST-RECENT", "PAST-OLD"]);
  });

  it("returns the soonest upcoming appointment or null", () => {
    expect(getNextUpcomingAppointment(appointments, NOW)?.code).toBe("TODAY");
    expect(getNextUpcomingAppointment([makeAppointment("OLD", "2020-01-01")], NOW)).toBeNull();
  });

  it("does not mutate the input list", () => {
    const snapshot = appointments.map((appointment) => appointment.code);
    getUpcomingAppointments(appointments, NOW);
    getPastAppointments(appointments, NOW);
    expect(appointments.map((appointment) => appointment.code)).toEqual(snapshot);
  });
});
