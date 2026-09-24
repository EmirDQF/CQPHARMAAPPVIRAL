import { describe, expect, it } from "vitest";
import { createConsentRecord } from "../privacy/consent";
import { createAppointmentBodySchema, createLeadBodySchema } from "./schemas";

const consent = createConsentRecord(new Date("2026-09-24T15:00:00Z"));

const validAppointment = {
  code: "ART-ABC123",
  serviceId: "densitometria",
  date: "2026-09-25",
  slot: "manana",
  patient: { name: "  María Torres ", age: 58, phone: "987654321", bookedBy: "propia" },
  consent,
};

describe("createAppointmentBodySchema", () => {
  it("rejects an appointment with personal data but no consent", () => {
    const withoutConsent = { ...validAppointment, consent: undefined };
    expect(createAppointmentBodySchema.safeParse(withoutConsent).success).toBe(false);
  });

  it("accepts a consented appointment and trims the patient name", () => {
    const parsed = createAppointmentBodySchema.parse(validAppointment);
    expect(parsed.patient.name).toBe("María Torres");
    expect(parsed.consent.consentVersion).toBe(consent.consentVersion);
  });

  it("rejects an out-of-range age and a malformed date", () => {
    expect(
      createAppointmentBodySchema.safeParse({
        ...validAppointment,
        patient: { ...validAppointment.patient, age: 130 },
      }).success
    ).toBe(false);
    expect(
      createAppointmentBodySchema.safeParse({ ...validAppointment, date: "25/09/2026" }).success
    ).toBe(false);
  });
});

describe("createLeadBodySchema", () => {
  const anonymousLead = { chronologicalAge: 52, articularAge: 63, riskLevel: "moderado" };

  it("accepts an anonymous lead without consent", () => {
    expect(createLeadBodySchema.safeParse(anonymousLead).success).toBe(true);
  });

  it("rejects a lead that carries a phone without consent", () => {
    expect(
      createLeadBodySchema.safeParse({ ...anonymousLead, phone: "987654321" }).success
    ).toBe(false);
  });

  it("accepts a lead with phone when consent is present", () => {
    expect(
      createLeadBodySchema.safeParse({ ...anonymousLead, phone: "987654321", consent }).success
    ).toBe(true);
  });
});
