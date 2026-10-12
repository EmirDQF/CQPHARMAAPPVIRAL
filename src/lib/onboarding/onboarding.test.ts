import { describe, expect, it } from "vitest";
import { emptyPatientProfile } from "../dashboard/patientProfile";
import { CONSENT_VERSION } from "../privacy/consent";
import {
  DAILY_GOAL_BY_INTENSITY,
  EMPTY_ONBOARDING_STATE,
  PROFILE_OFFER_SNOOZE_DAYS,
  completeOnboarding,
  needsOnboarding,
  onboardingStore,
  profileQuestions,
  shouldOfferProfileCompletion,
  snoozeProfileOffer,
  startOnboarding,
  parseOnboardingState,
  validateFirstRunAge,
  validateFirstRunName,
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
      profileOfferSnoozedAt: null,
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

describe("profileQuestions", () => {
  it("asks one thing per screen: name, age, sex and fracture history", () => {
    expect(profileQuestions({ sex: null })).toEqual(["name", "age", "sex", "fracture"]);
    expect(profileQuestions({ sex: "masculino" })).toEqual(["name", "age", "sex", "fracture"]);
  });

  it("adds the menopause question right after sex only for women", () => {
    expect(profileQuestions({ sex: "femenino" })).toEqual(["name", "age", "sex", "menopause", "fracture"]);
  });
});

describe("first-run field validation", () => {
  it("requires a name and trims it", () => {
    expect(validateFirstRunName("  ")).toEqual({ ok: false, error: "Escribe tu nombre o cómo te gusta que te llamen." });
    expect(validateFirstRunName("  Rosa ")).toEqual({ ok: true, value: "Rosa" });
    expect(validateFirstRunName("x".repeat(41)).ok).toBe(false);
  });

  it("accepts an empty age (prefers not to say) and rejects implausible ones kindly", () => {
    expect(validateFirstRunAge("")).toEqual({ ok: true, value: null });
    expect(validateFirstRunAge("63")).toEqual({ ok: true, value: 63 });
    const result = validateFirstRunAge("150");
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toMatch(/déjalo vacío/);
    expect(validateFirstRunAge("6.5").ok).toBe(false);
  });
});

describe("shouldOfferProfileCompletion (guest)", () => {
  const completed = { ...EMPTY_ONBOARDING_STATE, completedAt: NOW.toISOString() };
  const consented = {
    ...emptyPatientProfile,
    name: "Rosa",
    consent: { consentAt: NOW.toISOString(), consentVersion: CONSENT_VERSION },
  };

  it("offers it on Hoy to someone who declined consent", () => {
    expect(shouldOfferProfileCompletion(completed, emptyPatientProfile, NOW)).toBe(true);
  });

  it("never offers it during the first run or to someone with current consent", () => {
    expect(shouldOfferProfileCompletion(EMPTY_ONBOARDING_STATE, emptyPatientProfile, NOW)).toBe(false);
    expect(shouldOfferProfileCompletion(completed, consented, NOW)).toBe(false);
  });

  it("waits the snooze period after 'Ahora no' and then offers it again", () => {
    onboardingStore.write(completed);
    snoozeProfileOffer(NOW);
    const snoozed = onboardingStore.getSnapshot();
    const almost = new Date(NOW.getTime() + (PROFILE_OFFER_SNOOZE_DAYS * 24 - 1) * 3600_000);
    const after = new Date(NOW.getTime() + PROFILE_OFFER_SNOOZE_DAYS * 24 * 3600_000);
    expect(shouldOfferProfileCompletion(snoozed, emptyPatientProfile, almost)).toBe(false);
    expect(shouldOfferProfileCompletion(snoozed, emptyPatientProfile, after)).toBe(true);
    onboardingStore.write(EMPTY_ONBOARDING_STATE);
  });
});
