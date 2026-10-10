// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addDexaScanEntry, dexaVaultStore } from "./dexaVault";
import { painLogStore, saveTodayPainLogEntry } from "./painLog";
import {
  emptyPatientProfile,
  normalizeStoredPatientProfile,
  patientProfileStore,
  savePatientProfile,
} from "./patientProfile";

// 10:00 en Lima (UTC-5).
const NOW = new Date("2026-10-10T15:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  painLogStore.write([]);
  dexaVaultStore.write([]);
  patientProfileStore.write(emptyPatientProfile);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("marca de edición local (updatedAt) para resolver conflictos de C3", () => {
  it("el check-in de dolor guarda cuándo se editó", () => {
    saveTodayPainLogEntry({ painLevel: 4, stiffness: "0-15" });

    expect(painLogStore.getSnapshot()).toEqual([
      { date: "2026-10-10", painLevel: 4, stiffness: "0-15", updatedAt: NOW.toISOString() },
    ]);
  });

  it("volver a registrar el dolor del día renueva la marca", () => {
    saveTodayPainLogEntry({ painLevel: 4, stiffness: "0-15" });
    vi.setSystemTime(new Date("2026-10-10T16:00:00.000Z"));

    saveTodayPainLogEntry({ painLevel: 6, stiffness: "15-30" });

    expect(painLogStore.getSnapshot()).toHaveLength(1);
    expect(painLogStore.getSnapshot()[0].updatedAt).toBe("2026-10-10T16:00:00.000Z");
  });

  it("una densitometría nueva guarda cuándo se registró", () => {
    addDexaScanEntry({
      date: "2026-09-01",
      lumbarTScore: -1.6,
      femoralNeckTScore: -1.2,
      radiologyCenter: "",
    });

    expect(dexaVaultStore.getSnapshot()[0].updatedAt).toBe(NOW.toISOString());
  });

  it("guardar el perfil guarda cuándo se editó", () => {
    savePatientProfile({ ...emptyPatientProfile, name: "Paciente Prueba", age: 58 });

    expect(patientProfileStore.getSnapshot()).toMatchObject({
      name: "Paciente Prueba",
      updatedAt: NOW.toISOString(),
    });
  });

  it("el perfil guardado conserva su marca al releerse", () => {
    const stored = { ...emptyPatientProfile, updatedAt: "2026-10-01T12:00:00.000Z" };

    expect(normalizeStoredPatientProfile(stored)?.updatedAt).toBe("2026-10-01T12:00:00.000Z");
  });

  it("una marca corrupta se descarta sin perder el resto del perfil", () => {
    const stored = { ...emptyPatientProfile, name: "Paciente Prueba", updatedAt: "ayer" };

    const profile = normalizeStoredPatientProfile(stored);

    expect(profile?.name).toBe("Paciente Prueba");
    expect(profile).not.toHaveProperty("updatedAt");
  });

  it("los registros guardados antes de C3 (sin marca) se siguen leyendo", () => {
    expect(normalizeStoredPatientProfile({ ...emptyPatientProfile, age: 60 })).not.toHaveProperty(
      "updatedAt"
    );
  });
});
