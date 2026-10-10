// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  emptyPatientProfile,
  patientProfileStore,
  type PatientProfile,
} from "@/lib/dashboard/patientProfile";
import { createFakeSupabase, type FakeSupabase } from "@/test/fakeSupabase";
import {
  PROFILE_KEY,
  createLocalProfileRepository,
  createSupabaseProfileRepository,
  type ProfileValue,
} from "./profile";
import type { RepositoryClient } from "./supabaseRows";

const NOW = new Date("2026-10-10T15:00:00.000Z");
const consent = { consentAt: "2026-09-30T12:00:00.000Z", consentVersion: "2026-09-24-provisional" };

const filledProfile: ProfileValue = {
  name: "Paciente Prueba",
  age: 58,
  sex: "femenino",
  weightKg: 64.5,
  hasFractureHistory: null,
  menopausalStatus: "posmenopausica",
  allergies: "",
  phone: "987654321",
  updatedAt: "2026-10-01T12:00:00.000Z",
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  patientProfileStore.write(emptyPatientProfile);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("LocalProfileRepository", () => {
  const repository = createLocalProfileRepository();

  it("un perfil vacío no es un registro: no se sube nada en blanco", async () => {
    await expect(repository.list()).resolves.toEqual([]);
  });

  it("lista el perfil sin el consentimiento local, que no viaja", async () => {
    const stored: PatientProfile = { ...filledProfile, consent };
    patientProfileStore.write(stored);

    await expect(repository.list()).resolves.toEqual([
      { key: PROFILE_KEY, value: filledProfile, updatedAt: "2026-10-01T12:00:00.000Z" },
    ]);
  });

  it("aplicar el perfil remoto conserva el consentimiento dado en este celular", async () => {
    patientProfileStore.write({ ...emptyPatientProfile, consent });

    await repository.upsertMany([filledProfile]);

    expect(patientProfileStore.getSnapshot()).toEqual({ ...filledProfile, consent });
  });
});

describe("SupabaseProfileRepository", () => {
  let fake: FakeSupabase;
  let repository: ReturnType<typeof createSupabaseProfileRepository>;

  beforeEach(() => {
    fake = createFakeSupabase();
    repository = createSupabaseProfileRepository(fake.client as unknown as RepositoryClient);
  });

  it("sin perfil en la base, no hay registro", async () => {
    await expect(repository.list()).resolves.toEqual([]);
  });

  it("sube y vuelve a leer el perfil con la hora de la base", async () => {
    await repository.upsertMany([filledProfile]);

    await expect(repository.list()).resolves.toEqual([
      {
        key: PROFILE_KEY,
        value: { ...filledProfile, updatedAt: NOW.toISOString() },
        updatedAt: NOW.toISOString(),
      },
    ]);
  });

  it("guardar dos veces actualiza la misma fila del paciente", async () => {
    await repository.upsertMany([filledProfile]);
    await repository.upsertMany([{ ...filledProfile, age: 59 }]);

    expect(fake.rows("profiles")).toEqual([expect.objectContaining({ age: 59 })]);
  });

  it("nunca redondea el peso: un segundo decimal no se sube", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    await repository.upsertMany([{ ...filledProfile, weightKg: 64.55 }]);

    expect(fake.rows("profiles")).toEqual([]);
  });
});
