/** @vitest-environment jsdom */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { patientProfileStore, emptyPatientProfile } from "@/lib/dashboard/patientProfile";
import { EMPTY_ONBOARDING_STATE, needsOnboarding, onboardingStore } from "@/lib/onboarding/onboarding";
import { CONSENT_VERSION } from "@/lib/privacy/consent";
import { FirstRunFlow } from "./FirstRunFlow";
import { SPLASH_DURATION_MS } from "./IntroSteps";

vi.mock("@/lib/feedback/haptics", () => ({ triggerHaptic: vi.fn(async () => undefined) }));

afterEach(() => {
  vi.useRealTimers();
  onboardingStore.write(EMPTY_ONBOARDING_STATE);
  patientProfileStore.write(emptyPatientProfile);
  window.localStorage.clear();
});

function click(name: RegExp | string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

function heading(): string {
  return screen.getByRole("heading", { level: 1 }).textContent ?? "";
}

function acceptConsent() {
  fireEvent.click(screen.getByRole("checkbox"));
  click("Acepto y sigo");
}

describe("FirstRunFlow", () => {
  it("leaves the splash by itself in at most 1.5 s and greets with a single Artiko welcome", () => {
    vi.useFakeTimers();
    render(<FirstRunFlow />);
    act(() => vi.advanceTimersByTime(SPLASH_DURATION_MS));
    expect(heading()).toBe("Hola, soy Artiko, cuéntame de ti");
    expect(screen.getByText("Paso 1 de 7")).toBeInTheDocument();
  });

  it("reaches the consent form in two taps: splash → welcome → consent", () => {
    render(<FirstRunFlow />);
    click(/Toca para continuar/);
    click("Empezar");
    expect(heading()).toBe("Tus datos, tus reglas");
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("asks consent first, then one question per screen in order, and saves the profile", () => {
    render(<FirstRunFlow />);
    click(/Toca para continuar/);
    click("Empezar");
    expect(screen.queryByLabelText("¿Cómo te llamo?")).toBeNull();

    click("Acepto y sigo");
    expect(heading()).toBe("Tus datos, tus reglas");
    acceptConsent();

    const seen: string[] = [];
    seen.push(heading());
    click("Siguiente");
    expect(screen.getByText("Escribe tu nombre o cómo te gusta que te llamen.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("¿Cómo te llamo?"), { target: { value: "Rosa María" } });
    click("Siguiente");

    seen.push(heading());
    const ageInput = screen.getByLabelText("¿Cuántos años tienes?");
    expect(ageInput).toHaveAttribute("inputmode", "numeric");
    fireEvent.change(ageInput, { target: { value: "150" } });
    click("Siguiente");
    expect(screen.getByText(/déjalo vacío si prefieres no decirlo/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("¿Cuántos años tienes?"), { target: { value: "66" } });
    click("Siguiente");

    seen.push(heading());
    fireEvent.click(screen.getByRole("radio", { name: "Femenino" }));
    click("Siguiente");

    seen.push(heading());
    fireEvent.click(screen.getByRole("radio", { name: "Sí, ya la pasé" }));
    click("Siguiente");

    seen.push(heading());
    fireEvent.click(screen.getByRole("radio", { name: "Sí" }));
    expect(patientProfileStore.getSnapshot()).toEqual(emptyPatientProfile);
    click("Guardar y seguir");

    expect(seen).toEqual([
      "¿Cómo te llamo?",
      "¿Cuántos años tienes?",
      "¿Cuál es tu sexo?",
      "¿Ya pasaste la menopausia?",
      "¿Alguna vez te fracturaste un hueso?",
    ]);
    expect(patientProfileStore.getSnapshot()).toMatchObject({
      name: "Rosa María",
      age: 66,
      sex: "femenino",
      menopausalStatus: "posmenopausica",
      hasFractureHistory: true,
    });
    expect(patientProfileStore.getSnapshot().consent?.consentVersion).toBe(CONSENT_VERSION);

    expect(heading()).toBe("¿Cuántas misiones al día?");
    fireEvent.click(screen.getByRole("radio", { name: /Pro · 7 al día/ }));
    click("¡Listo!");
    expect(heading()).toBe("¡Todo listo, Rosa!");
    click("Ir a Hoy");
    expect(onboardingStore.getSnapshot()).toMatchObject({ intensity: "pro" });
    expect(needsOnboarding(onboardingStore.getSnapshot(), patientProfileStore.getSnapshot())).toBe(false);
  });

  it("skips the menopause question for men and lets 'prefer not to say' through", () => {
    render(<FirstRunFlow />);
    click(/Toca para continuar/);
    click("Empezar");
    acceptConsent();
    fireEvent.change(screen.getByLabelText("¿Cómo te llamo?"), { target: { value: "Luis" } });
    click("Siguiente");
    click("Siguiente");
    fireEvent.click(screen.getByRole("radio", { name: "Masculino" }));
    click("Siguiente");
    expect(heading()).toBe("¿Alguna vez te fracturaste un hueso?");
    click("Guardar y seguir");
    expect(patientProfileStore.getSnapshot()).toMatchObject({
      name: "Luis",
      age: null,
      sex: "masculino",
      menopausalStatus: null,
      hasFractureHistory: null,
    });
  });

  it("offers four menopause answers in order and saves 'No estoy segura' with a kind note", () => {
    render(<FirstRunFlow />);
    click(/Toca para continuar/);
    click("Empezar");
    acceptConsent();
    fireEvent.change(screen.getByLabelText("¿Cómo te llamo?"), { target: { value: "Ana" } });
    click("Siguiente");
    fireEvent.change(screen.getByLabelText("¿Cuántos años tienes?"), { target: { value: "52" } });
    click("Siguiente");
    fireEvent.click(screen.getByRole("radio", { name: "Femenino" }));
    click("Siguiente");

    expect(heading()).toBe("¿Ya pasaste la menopausia?");
    expect(screen.getByText(/Paso \d+ de \d+/)).toBeInTheDocument();
    expect(screen.getAllByRole("radio").map((radio) => radio.getAttribute("aria-label") ?? radio.closest("label")?.textContent?.trim())).toEqual([
      "Sí, ya la pasé",
      "Aún no",
      "No estoy segura",
      "Prefiero no decirlo",
    ]);
    fireEvent.click(screen.getByRole("radio", { name: "No estoy segura" }));
    expect(screen.getByText("Tu médico confirmará esto contigo.")).toBeInTheDocument();
    click("Siguiente");
    click("Guardar y seguir");
    expect(patientProfileStore.getSnapshot()).toMatchObject({ sex: "femenino", menopausalStatus: "no-segura" });
  });

  it("goes back one question without losing what was typed", () => {
    render(<FirstRunFlow />);
    click(/Toca para continuar/);
    click("Empezar");
    acceptConsent();
    fireEvent.change(screen.getByLabelText("¿Cómo te llamo?"), { target: { value: "Rosa" } });
    click("Siguiente");
    click("Atrás");
    expect(screen.getByLabelText("¿Cómo te llamo?")).toHaveValue("Rosa");
  });

  it("without consent saves no health data and lets the person continue as a guest", () => {
    render(<FirstRunFlow />);
    click(/Toca para continuar/);
    click("Empezar");
    click("Prefiero no dar mis datos");
    expect(heading()).toBe("¿Cuántas misiones al día?");
    click("¡Listo!");
    expect(heading()).toBe("¡Todo listo!");
    click("Ir a Hoy");

    expect(patientProfileStore.getSnapshot()).toEqual(emptyPatientProfile);
    expect(window.localStorage.getItem("artikare_patient_profile_v1")).toBeNull();
    const stored = window.localStorage.getItem("artikare_onboarding_v1") ?? "";
    expect(stored).not.toMatch(/age|sex|fractur|menopaus/i);
    expect(onboardingStore.getSnapshot().completedAt).not.toBeNull();
  });
});
