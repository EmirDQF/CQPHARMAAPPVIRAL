/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { emptyPatientProfile, patientProfileStore } from "@/lib/dashboard/patientProfile";
import { EMPTY_ONBOARDING_STATE, onboardingStore } from "@/lib/onboarding/onboarding";
import { CONSENT_VERSION } from "@/lib/privacy/consent";
import { ProfileCompletionOffer } from "./ProfileCompletionOffer";

vi.mock("@/lib/feedback/haptics", () => ({ triggerHaptic: vi.fn(async () => undefined) }));

const COMPLETED = { ...EMPTY_ONBOARDING_STATE, completedAt: "2026-10-12T13:00:00.000Z" };

afterEach(() => {
  onboardingStore.write(EMPTY_ONBOARDING_STATE);
  patientProfileStore.write(emptyPatientProfile);
  window.localStorage.clear();
});

describe("ProfileCompletionOffer", () => {
  it("invites a guest to complete the profile and asks for consent in the form", () => {
    onboardingStore.write(COMPLETED);
    render(<ProfileCompletionOffer />);
    expect(screen.getByRole("heading", { name: "Estás usando la app como invitado" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Completar mi perfil" }));
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("hides after 'Ahora no'", () => {
    onboardingStore.write(COMPLETED);
    render(<ProfileCompletionOffer />);
    fireEvent.click(screen.getByRole("button", { name: "Ahora no" }));
    expect(screen.queryByRole("heading", { name: "Estás usando la app como invitado" })).toBeNull();
  });

  it("does not show to someone who already consented", () => {
    onboardingStore.write(COMPLETED);
    patientProfileStore.write({
      ...emptyPatientProfile,
      name: "Rosa",
      consent: { consentAt: "2026-10-12T13:00:00.000Z", consentVersion: CONSENT_VERSION },
    });
    render(<ProfileCompletionOffer />);
    expect(screen.queryByRole("heading", { name: "Estás usando la app como invitado" })).toBeNull();
  });
});
