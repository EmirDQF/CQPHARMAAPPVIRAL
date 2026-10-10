// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { painLogStore } from "@/lib/dashboard/painLog";
import type { PainLogEntry } from "@/lib/dashboard/types";
import { trashStore } from "@/lib/storage/trash";
import { createFakeSupabase, type FakeSupabase } from "@/test/fakeSupabase";
import { createLocalPainLogRepository, createSupabasePainLogRepository } from "./painLogs";
import type { RepositoryClient } from "./supabaseRows";
import { RepositoryError } from "./types";

const NOW = new Date("2026-10-10T15:00:00.000Z");

const legacyEntry: PainLogEntry = { date: "2026-10-01", painLevel: 3, stiffness: "0-15" };
const editedEntry: PainLogEntry = {
  date: "2026-10-02",
  painLevel: 5,
  stiffness: "15-30",
  updatedAt: "2026-10-02T13:00:00.000Z",
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  painLogStore.write([]);
  trashStore.write([]);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("LocalPainLogRepository", () => {
  const repository = createLocalPainLogRepository();

  it("lista por fecha y marca como desconocida la edición de registros previos a C3", async () => {
    painLogStore.write([legacyEntry, editedEntry]);

    await expect(repository.list()).resolves.toEqual([
      { key: "2026-10-01", value: legacyEntry, updatedAt: null },
      { key: "2026-10-02", value: editedEntry, updatedAt: "2026-10-02T13:00:00.000Z" },
    ]);
  });

  it("al aplicar un valor distinto, la versión local va a la papelera (nada se pierde)", async () => {
    painLogStore.write([legacyEntry]);
    const remote = { ...legacyEntry, painLevel: 7, updatedAt: "2026-10-05T12:00:00.000Z" };

    await repository.upsertMany([remote]);

    expect(painLogStore.getSnapshot()).toEqual([remote]);
    expect(trashStore.getSnapshot().map((item) => item.record)).toEqual([legacyEntry]);
  });

  it("aplicar el mismo valor no ensucia la papelera", async () => {
    painLogStore.write([editedEntry]);

    await repository.upsertMany([{ ...editedEntry, updatedAt: "2026-10-03T00:00:00.000Z" }]);

    expect(trashStore.getSnapshot()).toEqual([]);
    expect(painLogStore.getSnapshot()[0].updatedAt).toBe("2026-10-03T00:00:00.000Z");
  });

  it("un borrado remoto mueve el registro a la papelera, restaurable 30 días", async () => {
    painLogStore.write([legacyEntry, editedEntry]);

    await repository.deleteMany(["2026-10-01"]);

    expect(painLogStore.getSnapshot()).toEqual([editedEntry]);
    expect(trashStore.getSnapshot()[0]).toMatchObject({ kind: "pain", record: legacyEntry });
  });
});

describe("SupabasePainLogRepository", () => {
  let fake: FakeSupabase;
  let repository: ReturnType<typeof createSupabasePainLogRepository>;

  beforeEach(() => {
    fake = createFakeSupabase();
    repository = createSupabasePainLogRepository(fake.client as unknown as RepositoryClient);
  });

  it("sube y vuelve a leer los registros con la hora de la base", async () => {
    await repository.upsertMany([legacyEntry]);

    await expect(repository.list()).resolves.toEqual([
      {
        key: "2026-10-01",
        value: { ...legacyEntry, updatedAt: NOW.toISOString() },
        updatedAt: NOW.toISOString(),
      },
    ]);
  });

  it("es idempotente: reintentar el mismo lote no duplica filas", async () => {
    await repository.upsertMany([legacyEntry, editedEntry]);
    await repository.upsertMany([legacyEntry, editedEntry]);

    expect(fake.rows("pain_logs")).toHaveLength(2);
  });

  it("descarta un valor que la base rechazaría sin bloquear el resto del lote", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    await repository.upsertMany([{ ...legacyEntry, painLevel: 11 }, editedEntry]);

    expect(fake.rows("pain_logs").map((row) => row.log_date)).toEqual(["2026-10-02"]);
  });

  it("borra en suave por fecha y deja de listarlo", async () => {
    await repository.upsertMany([legacyEntry, editedEntry]);

    await repository.deleteMany(["2026-10-01"]);

    expect(fake.rows("pain_logs").find((row) => row.log_date === "2026-10-01")?.deleted_at).not.toBeNull();
    expect((await repository.list()).map((record) => record.key)).toEqual(["2026-10-02"]);
  });

  it("volver a registrar un día borrado reemplaza la fila borrada", async () => {
    await repository.upsertMany([legacyEntry]);
    await repository.deleteMany(["2026-10-01"]);

    await repository.upsertMany([{ ...legacyEntry, painLevel: 2 }]);

    expect(fake.rows("pain_logs")).toEqual([expect.objectContaining({ pain_level: 2, deleted_at: null })]);
  });

  it("un fallo de la base se informa sin valores clínicos en el mensaje", async () => {
    fake.failNext("select");

    const failure = repository.list();

    await expect(failure).rejects.toBeInstanceOf(RepositoryError);
    await expect(failure).rejects.toThrow("[repositorio] listar pain_logs falló");
  });
});
