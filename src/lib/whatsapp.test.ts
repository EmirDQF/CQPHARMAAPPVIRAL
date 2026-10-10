import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Appointment } from "./appointments/types";
import { productPacks } from "./products";
import {
  buildAppointmentConfirmationWhatsAppLink,
  buildClinicalReportWhatsAppLink,
  buildDensitometriaWhatsAppLink,
  buildGeneralInquiryWhatsAppLink,
  buildProductPackWhatsAppLink,
  buildSupplementWhatsAppLink,
  isWhatsAppAvailable,
} from "./whatsapp";

/** Número de prueba (no es un número real del consultorio). */
const TEST_NUMBER = "51987654321";

const appointment: Appointment = {
  code: "ART-XK7P2Q",
  serviceId: "densitometria",
  date: "2026-09-30",
  slot: "manana",
  patient: { name: "María Torres", age: 58, phone: "987654321", bookedBy: "propia" },
  createdAt: "2026-09-24T15:00:00.000Z",
};

const ALL_BUILDERS: Array<[string, () => string | null]> = [
  ["densitometria", buildDensitometriaWhatsAppLink],
  ["supplement", buildSupplementWhatsAppLink],
  ["productPack", () => buildProductPackWhatsAppLink(productPacks[0])],
  ["generalInquiry", buildGeneralInquiryWhatsAppLink],
  ["appointment", () => buildAppointmentConfirmationWhatsAppLink(appointment)],
  ["clinicalReport", buildClinicalReportWhatsAppLink],
];

function prefilledText(link: string | null): string {
  if (!link) throw new Error("expected a WhatsApp link");
  return new URL(link).searchParams.get("text") ?? "";
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("with a valid Peruvian WhatsApp number", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_NUMBER", TEST_NUMBER);
  });

  it.each(ALL_BUILDERS)("%s builds a wa.me link to the configured number", (_name, build) => {
    expect(build()).toMatch(new RegExp(`^https://wa\\.me/${TEST_NUMBER}\\?text=.+`));
    expect(isWhatsAppAvailable()).toBe(true);
  });

  it.each(["+51987654321", " 51 987 654 321 ", "51-987-654-321"])(
    "normalizes the E.164 format %j",
    (configured) => {
      vi.stubEnv("NEXT_PUBLIC_WHATSAPP_NUMBER", configured);
      expect(buildGeneralInquiryWhatsAppLink()).toMatch(`https://wa.me/${TEST_NUMBER}?`);
    }
  );

  it("appointment confirmation carries only the appointment code (B3)", () => {
    const text = prefilledText(buildAppointmentConfirmationWhatsAppLink(appointment));
    expect(text).toContain("ART-XK7P2Q");
    expect(text).not.toMatch(/densitometr|reumatolog|2026-09-30|mañana|tarde|María|987654321/i);
  });
});

describe("without a usable WhatsApp number (any environment)", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["old placeholder", "51999999999x"],
    ["landline", "5114567890"],
    ["mobile without country code", "987654321"],
    ["mobile not starting with 9", "51887654321"],
    ["too long", "519876543210"],
    ["another country", "34612345678"],
  ])("returns null when the number is %s", (_label, configured) => {
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_NUMBER", configured);
    for (const [, build] of ALL_BUILDERS) {
      expect(build()).toBeNull();
    }
    expect(isWhatsAppAvailable()).toBe(false);
  });

  it.each(["production", "development"])("never falls back to a fake number in %s", (nodeEnv) => {
    vi.stubEnv("NODE_ENV", nodeEnv);
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_NUMBER", undefined);
    expect(buildGeneralInquiryWhatsAppLink()).toBeNull();
  });
});
