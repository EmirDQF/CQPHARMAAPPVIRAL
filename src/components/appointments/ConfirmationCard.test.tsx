// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Appointment } from "@/lib/appointments/types";
import { emptyPatientProfile, patientProfileStore } from "@/lib/dashboard/patientProfile";
import { ConfirmationCard } from "./ConfirmationCard";

const appointment: Appointment = {
  code: "ART-XK7P2Q",
  serviceId: "densitometria",
  date: "2026-09-30",
  slot: "manana",
  patient: { name: "María Torres", age: 58, phone: "987654321", bookedBy: "propia" },
  createdAt: "2026-09-24T15:00:00.000Z",
};

afterEach(() => {
  cleanup();
  patientProfileStore.write(emptyPatientProfile);
});

describe("ConfirmationCard cross-sell (B6)", () => {
  it("offers the supplement pack without red flags", () => {
    render(<ConfirmationCard appointment={appointment} />);
    expect(screen.getByText("Reservar pack con descuento")).toBeInTheDocument();
  });

  it("hides every supplement upsell and prioritizes rheumatology with a red flag", () => {
    patientProfileStore.write({ ...emptyPatientProfile, hasFractureHistory: true });
    render(<ConfirmationCard appointment={appointment} />);

    expect(screen.queryByText("Reservar pack con descuento")).not.toBeInTheDocument();
    expect(screen.queryByText(/% OFF/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Agendar evaluación reumatológica" })).toHaveAttribute(
      "href",
      "/citas"
    );
  });
});
