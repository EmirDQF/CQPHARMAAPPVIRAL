/** @vitest-environment jsdom */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { patientProfileStore, emptyPatientProfile } from "@/lib/dashboard/patientProfile";
import { EMPTY_ONBOARDING_STATE, onboardingStore } from "@/lib/onboarding/onboarding";
import { CONSENT_VERSION } from "@/lib/privacy/consent";
import { FirstRunFlow } from "./FirstRunFlow";
import { SPLASH_DURATION_MS } from "./IntroSteps";

vi.mock("@/lib/feedback/haptics", () => ({ triggerHaptic: vi.fn(async () => undefined) }));

afterEach(() => {
  vi.useRealTimers();
  onboardingStore.write(EMPTY_ONBOARDING_STATE);
  patientProfileStore.write(emptyPatientProfile);
});

function click(name: RegExp | string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

function passIntro() {
  click(/Toca para continuar/);
  click("¡Vamos! 🎉");
  click("¡Me gusta! 💪");
}

describe("FirstRunFlow", () => {
  it("leaves the splash by itself in at most 1.5 s", () => {
    vi.useFakeTimers();
    render(<FirstRunFlow />);
    act(() => vi.advanceTimersByTime(SPLASH_DURATION_MS));
    expect(screen.getByRole("heading", { name: /Soy Artiko/ })).toBeInTheDocument();
  });

  it("asks consent before any personal data and saves only the age", () => {
    render(<FirstRunFlow />);
    passIntro();
    expect(screen.queryByLabelText("¿Cómo te llamo?")).toBeNull();

    click(/Acepto y sigo/);
    expect(screen.getByRole("heading", { name: /Tus datos, tus reglas/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox"));
    click(/Acepto y sigo/);

    click("Guardar y seguir");
    expect(screen.getByText("Escribe tu nombre o cómo te gusta que te llamen.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("¿Cómo te llamo?"), { target: { value: "Rosa María" } });
    fireEvent.change(screen.getByLabelText(/Fecha de nacimiento/), { target: { value: "1960-05-20" } });
    fireEvent.click(screen.getByRole("radio", { name: "Femenino" }));
    fireEvent.click(screen.getByRole("radio", { name: "Ya pasé la menopausia" }));
    click("Guardar y seguir");

    const saved = patientProfileStore.getSnapshot();
    expect(saved).toMatchObject({ name: "Rosa María", sex: "femenino", menopausalStatus: "posmenopausica" });
    expect(saved.age).toBeGreaterThanOrEqual(65);
    expect(saved.consent?.consentVersion).toBe(CONSENT_VERSION);
    expect(window.localStorage.getItem("artikare_patient_profile_v1")).not.toContain("1960-05-20");

    fireEvent.click(screen.getByRole("radio", { name: /Pro · 7 al día/ }));
    click(/¡Listo!/);
    expect(screen.getByRole("heading", { name: "¡Todo listo, Rosa! 🎉" })).toBeInTheDocument();
    click(/Ir a Hoy/);
    expect(onboardingStore.getSnapshot()).toMatchObject({ intensity: "pro" });
    expect(onboardingStore.getSnapshot().completedAt).not.toBeNull();
  });

  it("lets the person skip all personal data and still use the app", () => {
    render(<FirstRunFlow />);
    passIntro();
    click("Prefiero no dar mis datos");
    expect(screen.getByRole("heading", { name: /Tu meta diaria/ })).toBeInTheDocument();
    click(/¡Listo!/);
    expect(screen.getByRole("heading", { name: "¡Todo listo! 🎉" })).toBeInTheDocument();
    click(/Ir a Hoy/);
    expect(patientProfileStore.getSnapshot()).toEqual(emptyPatientProfile);
    expect(onboardingStore.getSnapshot().completedAt).not.toBeNull();
  });
});
