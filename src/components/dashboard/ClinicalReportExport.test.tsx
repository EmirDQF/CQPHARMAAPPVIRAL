// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dexaVaultStore } from "@/lib/dashboard/dexaVault";
import { emptyPatientProfile, patientProfileStore } from "@/lib/dashboard/patientProfile";
import { ClinicalReportExport } from "./ClinicalReportExport";

function readBlobText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

async function downloadReportText(): Promise<string> {
  let downloaded: Blob | null = null;
  vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
    downloaded = blob as Blob;
    return "blob:artikare-test";
  });
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

  render(<ClinicalReportExport />);
  fireEvent.click(screen.getByRole("button", { name: "Descargar informe" }));
  if (!downloaded) throw new Error("El informe no se generó");
  return readBlobText(downloaded);
}

beforeEach(() => {
  dexaVaultStore.write([
    {
      id: "dexa-1",
      date: "2026-08-15",
      lumbarTScore: -2.7,
      femoralNeckTScore: -1.9,
      radiologyCenter: "Centro de prueba",
    },
  ]);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  dexaVaultStore.write([]);
  patientProfileStore.write(emptyPatientProfile);
});

describe("ClinicalReportExport downloaded text", () => {
  it("uses the Z-score referral for a premenopausal patient", async () => {
    patientProfileStore.write({
      ...emptyPatientProfile,
      age: 34,
      sex: "femenino",
      menopausalStatus: "premenopausica",
      hasFractureHistory: false,
    });
    const text = await downloadReportText();
    expect(text).toContain("Consulte a su médico (Z-score)");
    expect(text).not.toMatch(/Osteoporosis|Osteopenia|Normal/);
  });

  it("omits the incomplete-profile note for a complete postmenopausal profile", async () => {
    patientProfileStore.write({
      ...emptyPatientProfile,
      age: 61,
      sex: "femenino",
      menopausalStatus: "posmenopausica",
      hasFractureHistory: false,
    });
    const text = await downloadReportText();
    expect(text).toContain("(Osteoporosis)");
    expect(text).not.toContain("Completa tu perfil");
    expect(text).toContain("Banderas rojas: Tu última densitometría está en rango de osteoporosis");
  });
});
