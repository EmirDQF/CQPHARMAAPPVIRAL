import { describe, expect, it } from "vitest";
import { emptyPatientProfile } from "../dashboard/patientProfile";
import {
  DAILY_GOAL_BY_INTENSITY,
  EMPTY_ONBOARDING_STATE,
  ageFromBirthDate,
  completeOnboarding,
  needsOnboarding,
  onboardingStore,
  startOnboarding,
  parseOnboardingState,
  validateProfileStep,
} from "./onboarding";

const NOW = new Date("2026-10-11T15:00:00Z");

describe("needsOnboarding", () => {
  it("shows the first-run flow to a brand-new person", () => {
    expect(needsOnboarding(EMPTY_ONBOARDING_STATE, emptyPatientProfile)).toBe(true);
  });

  it("never repeats it once completed", () => {
    expect(needsOnboarding({ ...EMPTY_ONBOARDING_STATE, completedAt: NOW.toISOString() }, emptyPatientProfile)).toBe(false);
  });

  it("skips it for people who already saved a profile before this version (migration)", () => {
    expect(needsOnboarding(EMPTY_ONBOARDING_STATE, { ...emptyPatientProfile, name: "Rosa" })).toBe(false);
    expect(
      needsOnboarding(EMPTY_ONBOARDING_STATE, {
        ...emptyPatientProfile,
        consent: { consentAt: NOW.toISOString(), consentVersion: "x" },
      })
    ).toBe(false);
  });
});

describe("startOnboarding", () => {
  it("keeps the flow open after the name is saved mid-way, and after a reload", () => {
    onboardingStore.write(EMPTY_ONBOARDING_STATE);
    startOnboarding(NOW);
    expect(needsOnboarding(onboardingStore.getSnapshot(), { ...emptyPatientProfile, name: "Rosa" })).toBe(true);
    completeOnboarding("light", NOW);
    expect(needsOnboarding(onboardingStore.getSnapshot(), { ...emptyPatientProfile, name: "Rosa" })).toBe(false);
    expect(onboardingStore.getSnapshot().intensity).toBe("light");
  });
});

describe("parseOnboardingState", () => {
  it("repairs a bad intensity and keeps the rest", () => {
    expect(parseOnboardingState({ version: 1, completedAt: NOW.toISOString(), intensity: "extreme" })).toEqual({
      version: 1,
      startedAt: null,
      completedAt: NOW.toISOString(),
      intensity: "normal",
    });
  });

  it("does not overwrite an unknown future version", () => {
    expect(parseOnboardingState({ version: 7 })).toBeNull();
  });
});

describe("daily goals", () => {
  it("maps light/normal/pro to 3, 5 and 7 activities", () => {
    expect(DAILY_GOAL_BY_INTENSITY).toEqual({ light: 3, normal: 5, pro: 7 });
  });
});

describe("ageFromBirthDate (Lima)", () => {
  it("counts the birthday only once it arrives in Lima", () => {
    expect(ageFromBirthDate("1966-10-11", NOW)).toBe(60);
    expect(ageFromBirthDate("1966-10-12", NOW)).toBe(59);
  });

  it("returns null for future or impossible dates", () => {
    expect(ageFromBirthDate("2030-01-01", NOW)).toBeNull();
    expect(ageFromBirthDate("1800-01-01", NOW)).toBeNull();
    expect(ageFromBirthDate("1990-02-31", NOW)).toBeNull();
  });
});

describe("validateProfileStep", () => {
  it("asks kindly for a name or nickname", () => {
    const result = validateProfileStep({ name: "  ", birthDate: "", sex: null, menopausalStatus: null }, NOW);
    expect(result).toEqual({ ok: false, errors: { name: "Escribe tu nombre o cómo te gusta que te llamen." } });
  });

  it("accepts 'prefer not to say' for birth date and sex", () => {
    const result = validateProfileStep({ name: "Rosa", birthDate: "", sex: null, menopausalStatus: null }, NOW);
    expect(result).toEqual({ ok: true, value: { name: "Rosa", age: null, sex: null, menopausalStatus: null } });
  });

  it("stores only the age, never the birth date (data minimization)", () => {
    const result = validateProfileStep(
      { name: "Rosa", birthDate: "1962-03-04", sex: "femenino", menopausalStatus: "posmenopausica" },
      NOW
    );
    expect(result).toEqual({
      ok: true,
      value: { name: "Rosa", age: 64, sex: "femenino", menopausalStatus: "posmenopausica" },
    });
  });

  it("drops menopausal status for men", () => {
    const result = validateProfileStep(
      { name: "Luis", birthDate: "1960-01-01", sex: "masculino", menopausalStatus: "posmenopausica" },
      NOW
    );
    expect(result.ok && result.value.menopausalStatus).toBeNull();
  });

  it("explains an impossible birth date", () => {
    const result = validateProfileStep({ name: "Rosa", birthDate: "2031-01-01", sex: null, menopausalStatus: null }, NOW);
    expect(result).toEqual({ ok: false, errors: { birthDate: "Revisa la fecha: debe ser un día que ya pasó." } });
  });
});
