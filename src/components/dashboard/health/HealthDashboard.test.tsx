/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { dexaVaultStore } from "@/lib/dashboard/dexaVault";
import { painLogStore } from "@/lib/dashboard/painLog";
import { patientProfileStore, emptyPatientProfile } from "@/lib/dashboard/patientProfile";
import { HealthDashboard } from "./HealthDashboard";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/app" }));
vi.mock("@/lib/feedback/haptics", () => ({ triggerHaptic: vi.fn(async () => undefined) }));
vi.mock("@/lib/feedback/sounds", () => ({ playSound: vi.fn() }));

afterEach(() => {
  patientProfileStore.write(emptyPatientProfile);
  painLogStore.write([]);
  dexaVaultStore.write([]);
  window.localStorage.clear();
  push.mockClear();
});

describe("HealthDashboard (Mi salud)", () => {
  it("shows one next step, the empty bone state, adherence rings and recorded stiffness only", async () => {
    const onNavigate = vi.fn();
    render(<HealthDashboard onNavigate={onNavigate} />);
    expect(await screen.findByRole("heading", { level: 1, name: "Mi salud" })).toBeInTheDocument();
    expect(screen.getByText("Tu siguiente paso")).toBeInTheDocument();
    expect(screen.getByText("Sin densitometría registrada")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Tomas anotadas en 7 días: 0 por ciento/ })).toBeInTheDocument();
    expect(screen.getByText(/Aún no hay chequeos registrados/)).toBeInTheDocument();

    // Según la hora real, primero la toma pendiente o el chequeo: ambos llevan a "Mi día".
    fireEvent.click(screen.getByRole("button", { name: /^Ir a(l chequeo| Mi día)$/ }));
    expect(onNavigate).toHaveBeenCalledWith("hoy");
  });

  it("puts the rheumatology evaluation as the only next step with a red flag", async () => {
    patientProfileStore.write({ ...emptyPatientProfile, hasFractureHistory: true });
    render(<HealthDashboard onNavigate={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Agendar evaluación" }));
    expect(push).toHaveBeenCalledWith("/citas");
  });
});
