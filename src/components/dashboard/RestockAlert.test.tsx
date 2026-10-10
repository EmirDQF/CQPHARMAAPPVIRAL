// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RESTOCK_TRIGGER_DAY } from "@/lib/clinical/constants";
import { bottlesStore } from "@/lib/dashboard/bottles";
import { emptyPatientProfile, patientProfileStore } from "@/lib/dashboard/patientProfile";
import { pillboxStore } from "@/lib/dashboard/pillbox";
import { addDaysToIsoDate } from "@/lib/utils/date";
import { RestockAlert } from "./RestockAlert";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_WHATSAPP_NUMBER", "51987654321");
  const takenDoseIdsByDate = Object.fromEntries(
    Array.from({ length: RESTOCK_TRIGGER_DAY }, (_, index) => [
      addDaysToIsoDate("2026-06-01", index),
      ["night-magnesium"],
    ])
  );
  pillboxStore.write({ takenDoseIdsByDate });
});

afterEach(() => {
  vi.unstubAllEnvs();
  cleanup();
  pillboxStore.write({ takenDoseIdsByDate: {} });
  bottlesStore.write({ bottles: [] });
  patientProfileStore.write(emptyPatientProfile);
});

describe("RestockAlert", () => {
  it("offers the discounted restock on the trigger day", () => {
    render(<RestockAlert />);
    expect(screen.getByText("Reponer Mi Pack con Descuento")).toBeInTheDocument();
  });

  it("'Ya repuse mi frasco' starts a new bottle and hides the alert", () => {
    render(<RestockAlert />);
    fireEvent.click(screen.getByRole("button", { name: "Ya repuse mi frasco" }));

    expect(bottlesStore.getSnapshot().bottles).toHaveLength(1);
    expect(screen.queryByText("Reponer Mi Pack con Descuento")).not.toBeInTheDocument();
  });

  it("uses neutral copy without streak pressure", () => {
    render(<RestockAlert />);
    expect(screen.queryByText(/interrumpir tu racha/i)).not.toBeInTheDocument();
  });

  it("hides every supplement upsell while a red flag is active", () => {
    patientProfileStore.write({ ...emptyPatientProfile, hasFractureHistory: true });
    render(<RestockAlert />);
    expect(screen.queryByText("Reponer Mi Pack con Descuento")).not.toBeInTheDocument();
    expect(screen.queryByText(/descuento/i)).not.toBeInTheDocument();
  });
});
