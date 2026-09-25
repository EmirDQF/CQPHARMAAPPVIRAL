// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { dexaVaultStore } from "@/lib/dashboard/dexaVault";
import { painLogStore } from "@/lib/dashboard/painLog";
import { trashStore } from "@/lib/storage/trash";
import { addDaysToIsoDate, toLimaIsoDate } from "@/lib/utils/date";
import { ClinicalRecordsManager, RED_FLAG_DELETE_WARNING } from "./ClinicalRecordsManager";

const today = toLimaIsoDate();

afterEach(() => {
  dexaVaultStore.write([]);
  painLogStore.write([]);
  trashStore.write([]);
});

function seedScan(lumbarTScore: number) {
  dexaVaultStore.write([
    { id: "dexa-1", date: "2026-08-01", lumbarTScore, femoralNeckTScore: -1.2, radiologyCenter: "" },
  ]);
}

describe("ClinicalRecordsManager", () => {
  it("skips corrupt scans from localStorage instead of crashing", () => {
    dexaVaultStore.write([
      // Entrada corrupta: sin T-scores (p. ej. editada a mano o de una versión vieja).
      { id: "corrupt", date: "2026-08-01" } as never,
    ]);
    render(<ClinicalRecordsManager />);
    expect(screen.queryByRole("button", { name: /Borrar densitometría/ })).not.toBeInTheDocument();
  });

  it("uses the exact warning approved for red-flag records", () => {
    expect(RED_FLAG_DELETE_WARNING).toBe(
      "Este registro es importante para tu reumatólogo. ¿Seguro que quieres borrarlo?"
    );
  });

  it("asks for confirmation before deleting a scan in the osteoporosis range", () => {
    seedScan(-2.6);
    render(<ClinicalRecordsManager />);

    fireEvent.click(screen.getByRole("button", { name: /Borrar densitometría/ }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(RED_FLAG_DELETE_WARNING);

    fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(dexaVaultStore.getSnapshot()).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /Borrar densitometría/ }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Sí, borrar" }));
    expect(dexaVaultStore.getSnapshot()).toEqual([]);
    expect(trashStore.getSnapshot()).toHaveLength(1);
  });

  it("deletes a record without a red flag directly and lets the patient undo it", () => {
    seedScan(-1.2);
    render(<ClinicalRecordsManager />);

    fireEvent.click(screen.getByRole("button", { name: /Borrar densitometría/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(dexaVaultStore.getSnapshot()).toEqual([]);
    expect(screen.getByRole("status")).toHaveTextContent("Puedes deshacerlo durante 30 días");

    fireEvent.click(screen.getByRole("button", { name: /Deshacer/ }));
    expect(dexaVaultStore.getSnapshot()).toHaveLength(1);
    expect(trashStore.getSnapshot()).toEqual([]);
  });

  it("asks for confirmation when the pain day belongs to a 3-day streak of pain >= 8", () => {
    painLogStore.write(
      [2, 1, 0].map((daysAgo) => ({
        date: addDaysToIsoDate(today, -daysAgo),
        painLevel: 9,
        stiffness: "30+" as const,
      }))
    );
    render(<ClinicalRecordsManager />);

    fireEvent.click(screen.getAllByRole("button", { name: /Borrar registro de dolor/ })[0]);
    expect(screen.getByRole("dialog")).toHaveTextContent(RED_FLAG_DELETE_WARNING);
  });

  it("deletes an ordinary pain day without a dialog", () => {
    painLogStore.write([{ date: today, painLevel: 0, stiffness: "0-15" }]);
    render(<ClinicalRecordsManager />);

    fireEvent.click(screen.getByRole("button", { name: /Borrar registro de dolor/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(painLogStore.getSnapshot()).toEqual([]);
  });

  it("shows an empty state without records", () => {
    render(<ClinicalRecordsManager />);
    expect(screen.getByText(/Aún no tienes registros/)).toBeInTheDocument();
  });
});
