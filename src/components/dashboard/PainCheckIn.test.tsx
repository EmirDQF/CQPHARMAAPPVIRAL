// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { painLogStore } from "@/lib/dashboard/painLog";
import { addDaysToIsoDate, toLimaIsoDate } from "@/lib/utils/date";
import { PainCheckIn } from "./PainCheckIn";

afterEach(() => {
  painLogStore.write([]);
});

describe("PainCheckIn", () => {
  it("offers the full 0–10 scale with 0 labelled as no pain", () => {
    render(<PainCheckIn />);
    expect(screen.getByRole("button", { name: "0 · Sin dolor" })).toBeInTheDocument();
    for (let level = 1; level <= 10; level += 1) {
      expect(screen.getByRole("button", { name: String(level) })).toBeInTheDocument();
    }
  });

  it("saves a day without pain and celebrates the record itself", () => {
    render(<PainCheckIn />);
    fireEvent.click(screen.getByRole("button", { name: "0 · Sin dolor" }));
    fireEvent.click(screen.getByRole("button", { name: "0–15 min" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar registro de hoy" }));

    expect(painLogStore.getSnapshot()).toEqual([
      { date: toLimaIsoDate(), painLevel: 0, stiffness: "0-15" },
    ]);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Registraste tu día");
    // Constancia del registro, nunca atribución a un suplemento.
    expect(status.textContent).not.toMatch(/gracias a|suplement|colágeno|magnesio|mejor/i);
  });

  it("shows the saved 0 as selected when reopening the day", () => {
    painLogStore.write([{ date: toLimaIsoDate(), painLevel: 0, stiffness: "30+" }]);
    render(<PainCheckIn />);
    expect(screen.getByRole("button", { name: "0 · Sin dolor" })).toHaveAttribute("aria-pressed", "true");
  });

  describe("lowering today's pain when it keeps a severe-pain red flag active", () => {
    const today = toLimaIsoDate();

    function seedSevereStreakEndingToday() {
      painLogStore.write([
        { date: addDaysToIsoDate(today, -2), painLevel: 9, stiffness: "30+" },
        { date: addDaysToIsoDate(today, -1), painLevel: 8, stiffness: "30+" },
        { date: today, painLevel: 9, stiffness: "30+" },
      ]);
    }

    it("asks for confirmation before saving and keeps the record until confirmed", () => {
      seedSevereStreakEndingToday();
      render(<PainCheckIn />);

      fireEvent.click(screen.getByRole("button", { name: "2" }));
      fireEvent.click(screen.getByRole("button", { name: /actualizar/ }));

      expect(screen.getByRole("alert")).toHaveTextContent("importante para tu reumatólogo");
      expect(painLogStore.getSnapshot().find((entry) => entry.date === today)?.painLevel).toBe(9);

      fireEvent.click(screen.getByRole("button", { name: "Sí, corregir a 2" }));
      expect(painLogStore.getSnapshot().find((entry) => entry.date === today)?.painLevel).toBe(2);
    });

    it("lets the patient keep the original value", () => {
      seedSevereStreakEndingToday();
      render(<PainCheckIn />);

      fireEvent.click(screen.getByRole("button", { name: "2" }));
      fireEvent.click(screen.getByRole("button", { name: /actualizar/ }));
      fireEvent.click(screen.getByRole("button", { name: "Mantener 9" }));

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(painLogStore.getSnapshot().find((entry) => entry.date === today)?.painLevel).toBe(9);
      expect(screen.getByRole("button", { name: "9" })).toHaveAttribute("aria-pressed", "true");
    });

    it("saves directly when the new value still counts as severe", () => {
      seedSevereStreakEndingToday();
      render(<PainCheckIn />);

      fireEvent.click(screen.getByRole("button", { name: "8" }));
      fireEvent.click(screen.getByRole("button", { name: /actualizar/ }));

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(painLogStore.getSnapshot().find((entry) => entry.date === today)?.painLevel).toBe(8);
    });
  });
});
