// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dexaVaultStore, type DexaScanEntry } from "@/lib/dashboard/dexaVault";
import { trashStore } from "@/lib/storage/trash";
import { createFakeSupabase, type FakeSupabase } from "@/test/fakeSupabase";
import {
  createLocalDexaScanRepository,
  createSupabaseDexaScanRepository,
  type DexaScanValue,
} from "./dexaScans";
import type { RepositoryClient } from "./supabaseRows";

const NOW = new Date("2026-10-10T15:00:00.000Z");

const localScan: DexaScanEntry = {
  id: "dexa-1",
  date: "2026-08-15",
  lumbarTScore: -1.6,
  femoralNeckTScore: -1.2,
  radiologyCenter: "Centro A",
};
const localValue: DexaScanValue = {
  date: localScan.date,
  lumbarTScore: localScan.lumbarTScore,
  femoralNeckTScore: localScan.femoralNeckTScore,
  radiologyCenter: localScan.radiologyCenter,
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  dexaVaultStore.write([]);
  trashStore.write([]);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("LocalDexaScanRepository", () => {
  const repository = createLocalDexaScanRepository();

  it("lista por fecha de estudio, sin el id local", async () => {
    dexaVaultStore.write([localScan]);

    await expect(repository.list()).resolves.toEqual([
      { key: "2026-08-15", value: localValue, updatedAt: null },
    ]);
  });

  it("con dos estudios locales del mismo día, sincroniza el último registrado", async () => {
    const newer = { ...localScan, id: "dexa-2", lumbarTScore: -2.6 };
    dexaVaultStore.write([localScan, newer]);

    const records = await repository.list();

    expect(records).toHaveLength(1);
    expect(records[0].value.lumbarTScore).toBe(-2.6);
  });

  it("un estudio remoto nuevo se agrega con un id local", async () => {
    const remote: DexaScanValue = { ...localValue, date: "2026-09-01", updatedAt: NOW.toISOString() };

    await repository.upsertMany([remote]);

    expect(dexaVaultStore.getSnapshot()).toEqual([
      expect.objectContaining({ ...remote, id: expect.stringMatching(/^dexa-/) }),
    ]);
  });

  it("si el remoto trae otros T-score, el estudio local va a la papelera", async () => {
    dexaVaultStore.write([localScan]);
    const remote = { ...localValue, lumbarTScore: -2.5, updatedAt: NOW.toISOString() };

    await repository.upsertMany([remote]);

    expect(dexaVaultStore.getSnapshot()).toEqual([expect.objectContaining({ lumbarTScore: -2.5 })]);
    expect(trashStore.getSnapshot()).toEqual([
      expect.objectContaining({ kind: "dexa", record: localScan }),
    ]);
  });

  it("si el remoto trae los mismos valores, conserva el id y no usa la papelera", async () => {
    dexaVaultStore.write([localScan]);

    await repository.upsertMany([{ ...localValue, updatedAt: NOW.toISOString() }]);

    expect(dexaVaultStore.getSnapshot()).toEqual([{ ...localScan, updatedAt: NOW.toISOString() }]);
    expect(trashStore.getSnapshot()).toEqual([]);
  });

  it("un borrado remoto manda a la papelera todos los estudios de esa fecha", async () => {
    dexaVaultStore.write([localScan, { ...localScan, id: "dexa-2" }]);

    await repository.deleteMany(["2026-08-15"]);

    expect(dexaVaultStore.getSnapshot()).toEqual([]);
    expect(trashStore.getSnapshot()).toHaveLength(2);
  });
});

describe("SupabaseDexaScanRepository", () => {
  let fake: FakeSupabase;
  let repository: ReturnType<typeof createSupabaseDexaScanRepository>;

  beforeEach(() => {
    fake = createFakeSupabase();
    repository = createSupabaseDexaScanRepository(fake.client as unknown as RepositoryClient);
  });

  it("sube y vuelve a leer el estudio con la hora de la base", async () => {
    await repository.upsertMany([localValue]);

    await expect(repository.list()).resolves.toEqual([
      {
        key: "2026-08-15",
        value: { ...localValue, updatedAt: NOW.toISOString() },
        updatedAt: NOW.toISOString(),
      },
    ]);
    expect(fake.rows("dexa_scans")[0]).toMatchObject({ lumbar_t: -1.6, femoral_t: -1.2 });
  });

  it("es idempotente por fecha de estudio", async () => {
    await repository.upsertMany([localValue]);
    await repository.upsertMany([{ ...localValue, lumbarTScore: -1.7 }]);

    expect(fake.rows("dexa_scans")).toEqual([expect.objectContaining({ lumbar_t: -1.7 })]);
  });

  it("nunca redondea: un T-score con 3 decimales no se sube", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    await repository.upsertMany([{ ...localValue, lumbarTScore: -2.499 }]);

    expect(fake.rows("dexa_scans")).toEqual([]);
  });

  it("borra en suave por fecha", async () => {
    await repository.upsertMany([localValue]);

    await repository.deleteMany(["2026-08-15"]);

    await expect(repository.list()).resolves.toEqual([]);
    expect(fake.rows("dexa_scans")[0].deleted_at).not.toBeNull();
  });
});
