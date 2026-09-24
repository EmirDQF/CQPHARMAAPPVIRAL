// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RESTOCK_TRIGGER_DAY } from "@/lib/clinical/constants";
import { emptyPatientProfile, patientProfileStore } from "@/lib/dashboard/patientProfile";
import { pillboxStore } from "@/lib/dashboard/pillbox";
import { addDaysToIsoDate } from "@/lib/utils/date";
import { RestockAlert } from "./RestockAlert";

beforeEach(() => {
  const takenDoseIdsByDate = Object.fromEntries(
    Array.from({ length: RESTOCK_TRIGGER_DAY }, (_, index) => [
      addDaysToIsoDate("2026-06-01", index),
      ["night-magnesium"],
    ])
  );
  pillboxStore.write({ takenDoseIdsByDate });
});

afterEach(() => {
  cleanup();
  pillboxStore.write({ takenDoseIdsByDate: {} });
  patientProfileStore.write(emptyPatientProfile);
});

describe("RestockAlert", () => {
  it("offers the discounted restock on the trigger day", () => {
    render(<RestockAlert />);
    expect(screen.getByText("Reponer Mi Pack con Descuento")).toBeInTheDocument();
  });

  it("hides every supplement upsell while a red flag is active", () => {
    patientProfileStore.write({ ...emptyPatientProfile, hasFractureHistory: true });
    render(<RestockAlert />);
    expect(screen.queryByText("Reponer Mi Pack con Descuento")).not.toBeInTheDocument();
    expect(screen.queryByText(/descuento/i)).not.toBeInTheDocument();
  });
});
