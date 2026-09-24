import { describe, expect, it } from "vitest";
import type { Appointment } from "./appointments/types";
import { buildAppointmentConfirmationWhatsAppLink } from "./whatsapp";

const appointment: Appointment = {
  code: "ART-XK7P2Q",
  serviceId: "densitometria",
  date: "2026-09-30",
  slot: "manana",
  patient: { name: "María Torres", age: 58, phone: "987654321", bookedBy: "propia" },
  createdAt: "2026-09-24T15:00:00.000Z",
};

function prefilledText(link: string): string {
  return new URL(link).searchParams.get("text") ?? "";
}

describe("buildAppointmentConfirmationWhatsAppLink (B3)", () => {
  it("carries only the appointment code", () => {
    const text = prefilledText(buildAppointmentConfirmationWhatsAppLink(appointment));
    expect(text).toContain("ART-XK7P2Q");
    expect(text).not.toMatch(/densitometr|reumatolog|2026-09-30|mañana|tarde|María|987654321/i);
  });
});
