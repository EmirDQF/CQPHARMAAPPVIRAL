import { describe, expect, it } from "vitest";
import { normalizeStoredPatientProfile, parseProfileAgeInput } from "./patientProfile";

const consent = { consentAt: "2026-09-01T15:00:00.000Z", consentVersion: "2026-09-v1" };

const v1Profile = {
  name: "María Torres",
  age: 58,
  sex: "femenino",
  weightKg: 64,
  hasFractureHistory: false,
  allergies: "Penicilina",
  phone: "987654321",
};

describe("normalizeStoredPatientProfile (artikare_patient_profile_v1)", () => {
  it("keeps every v1 field and adds an empty menopausal status", () => {
    expect(normalizeStoredPatientProfile({ ...v1Profile, consent })).toEqual({
      ...v1Profile,
      consent,
      menopausalStatus: null,
    });
  });

  it("keeps a 'no' fracture answer when the profile was saved with consent", () => {
    expect(normalizeStoredPatientProfile({ ...v1Profile, consent })?.hasFractureHistory).toBe(false);
  });

  it("treats a default 'no' without consent as not answered", () => {
    expect(normalizeStoredPatientProfile(v1Profile)?.hasFractureHistory).toBeNull();
  });

  it("never discards a 'yes' fracture answer", () => {
    expect(
      normalizeStoredPatientProfile({ ...v1Profile, hasFractureHistory: true })?.hasFractureHistory
    ).toBe(true);
  });

  it("keeps a saved menopausal status", () => {
    expect(
      normalizeStoredPatientProfile({ ...v1Profile, consent, menopausalStatus: "posmenopausica" })
        ?.menopausalStatus
    ).toBe("posmenopausica");
  });

  it("resets only the corrupted fields", () => {
    const profile = normalizeStoredPatientProfile({ ...v1Profile, age: "cincuenta", sex: "x" });
    expect(profile?.age).toBeNull();
    expect(profile?.sex).toBeNull();
    expect(profile?.name).toBe("María Torres");
    expect(profile?.phone).toBe("987654321");
  });

  it.each([null, "texto", 42, [v1Profile]])("rejects a non-object value %j", (raw) => {
    expect(normalizeStoredPatientProfile(raw)).toBeNull();
  });
});

describe("parseProfileAgeInput", () => {
  it.each([
    ["", { ok: true, value: null }],
    [" 58 ", { ok: true, value: 58 }],
    ["119", { ok: true, value: 119 }],
  ] as const)("accepts %j", (raw, expected) => {
    expect(parseProfileAgeInput(raw)).toEqual(expected);
  });

  it.each(["0", "-5", "58.5", "120", "150", "1e2", "abc"])("rejects %j", (raw) => {
    expect(parseProfileAgeInput(raw).ok).toBe(false);
  });
});
