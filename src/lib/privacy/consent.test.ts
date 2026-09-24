import { describe, expect, it } from "vitest";
import { CONSENT_VERSION, createConsentRecord, isConsentCurrent } from "./consent";

describe("isConsentCurrent", () => {
  it("is false when the patient never consented", () => {
    expect(isConsentCurrent(undefined)).toBe(false);
  });

  it("is true for a record of the current policy version", () => {
    expect(isConsentCurrent(createConsentRecord())).toBe(true);
  });

  it("is false for a record of an older policy version", () => {
    expect(
      isConsentCurrent({ consentAt: "2025-01-01T00:00:00.000Z", consentVersion: "2025-01-01" })
    ).toBe(false);
    expect(CONSENT_VERSION).not.toBe("2025-01-01");
  });
});
