// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleSyncBatch } from "@/lib/api/handleSyncBatch";
import { bottlesStore } from "@/lib/dashboard/bottles";
import { dexaVaultStore } from "@/lib/dashboard/dexaVault";
import { painLogStore } from "@/lib/dashboard/painLog";
import { emptyPatientProfile, patientProfileStore } from "@/lib/dashboard/patientProfile";
import { pillboxStore } from "@/lib/dashboard/pillbox";
import { softDeletePainLog } from "@/lib/dashboard/recordDeletion";
import { createSupabaseBottleRepository } from "@/lib/repositories/bottles";
import { createSupabaseConsentRepository } from "@/lib/repositories/consents";
import { createSupabaseDexaScanRepository } from "@/lib/repositories/dexaScans";
import { createSupabaseDoseEventRepository } from "@/lib/repositories/doseEvents";
import { createSupabasePainLogRepository } from "@/lib/repositories/painLogs";
import { createSupabaseProfileRepository } from "@/lib/repositories/profile";
import type { RepositoryClient } from "@/lib/repositories/supabaseRows";
import { trashStore } from "@/lib/storage/trash";
import { createFakeSupabase, type FakeSupabase } from "@/test/fakeSupabase";
import {
  createLocalSyncRepositories,
  runAccountSync,
  type AccountSyncDependencies,
  type OutgoingSyncBatch,
} from "./runSync";
import { syncStateStore } from "./syncState";

const NOW = new Date("2026-10-10T15:00:00.000Z");
const USER_A = "00000000-0000-4000-8000-00000000a11c";
const USER_B = "00000000-0000-4000-8000-00000000b0b0";
const consent = { consentAt: "2026-10-10T12:00:00.000Z", consentVersion: "2026-09-24-provisional" };

let fake: FakeSupabase;
let client: RepositoryClient;
let outbox: OutgoingSyncBatch[];

function dependencies(overrides: Partial<AccountSyncDependencies> = {}): AccountSyncDependencies {
  return {
    userId: USER_A,
    consent,
    local: createLocalSyncRepositories(),
    remote: {
      profile: createSupabaseProfileRepository(client),
      painLogs: createSupabasePainLogRepository(client),
      dexaScans: createSupabaseDexaScanRepository(client),
      doseEvents: createSupabaseDoseEventRepository(client),
      bottles: createSupabaseBottleRepository(client),
    },
    isConsentActiveOnServer: () => createSupabaseConsentRepository(client).hasActive("respaldo-cuenta"),
    enqueue: (batch) => {
      outbox.push(batch);
      return true;
    },
    ...overrides,
  };
}

/** Lo que haría la outbox: envía en orden y se detiene en el primer fallo, sin perder lo pendiente. */
async function deliverOutbox(): Promise<number | null> {
  while (outbox.length > 0) {
    const result = await handleSyncBatch({
      client,
      requester: { id: USER_A, isAnonymous: false },
      body: outbox[0],
    });
    if (result.status !== 200) return result.status;
    outbox.shift();
  }
  return null;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.spyOn(console, "error").mockImplementation(() => {});
  fake = createFakeSupabase();
  client = fake.client as unknown as RepositoryClient;
  outbox = [];
  fake.seed("consents", [
    { purpose: "respaldo-cuenta", policy_version: consent.consentVersion, granted_at: consent.consentAt, revoked_at: null },
  ]);
  painLogStore.write([]);
  dexaVaultStore.write([]);
  pillboxStore.write({ takenDoseIdsByDate: {} });
  bottlesStore.write({ bottles: [] });
  patientProfileStore.write(emptyPatientProfile);
  trashStore.write([]);
  syncStateStore.write({ userId: null, bases: {} });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("runAccountSync: primer login", () => {
  it("sube todo lo local y baja todo lo de la cuenta: ambos terminan con la unión", async () => {
    painLogStore.write([{ date: "2026-10-01", painLevel: 3, stiffness: "0-15" }]);
    pillboxStore.write({ takenDoseIdsByDate: { "2026-10-09": ["morning-collagen"] } });
    bottlesStore.write({ bottles: [{ productId: "citrato-magnesio-d3", startedOn: "2026-09-01" }] });
    fake.seed("pain_logs", [{ log_date: "2026-10-02", pain_level: 5, stiffness: "15-30" }]);
    fake.seed("dose_events", [
      { dose_id: "night-magnesium", product_id: "citrato-magnesio-d3", taken_on: "2026-10-09", taken_at: "2026-10-10T02:30:00.000Z" },
    ]);

    await expect(runAccountSync(dependencies())).resolves.toMatchObject({ status: "synced" });
    await deliverOutbox();

    expect(painLogStore.getSnapshot().map((entry) => entry.date)).toEqual(["2026-10-01", "2026-10-02"]);
    expect(pillboxStore.getSnapshot().takenDoseIdsByDate["2026-10-09"]).toEqual([
      "morning-collagen",
      "night-magnesium",
    ]);
    expect(fake.rows("pain_logs").map((row) => row.log_date).sort()).toEqual(["2026-10-01", "2026-10-02"]);
    expect(fake.rows("dose_events")).toHaveLength(2);
    expect(fake.rows("bottles")).toHaveLength(1);
  });

  it("densitometría en conflicto: gana la edición más reciente y la otra queda en la papelera", async () => {
    dexaVaultStore.write([
      { id: "dexa-1", date: "2026-08-15", lumbarTScore: -1.6, femoralNeckTScore: -1.2, radiologyCenter: "", updatedAt: "2026-08-16T12:00:00.000Z" },
    ]);
    fake.seed("dexa_scans", [
      { scan_date: "2026-08-15", lumbar_t: -2.6, femoral_t: -1.2, radiology_center: "", updated_at: "2026-09-01T12:00:00.000Z" },
    ]);

    await runAccountSync(dependencies());

    expect(dexaVaultStore.getSnapshot()).toEqual([expect.objectContaining({ lumbarTScore: -2.6 })]);
    expect(trashStore.getSnapshot()).toEqual([
      expect.objectContaining({ kind: "dexa", record: expect.objectContaining({ lumbarTScore: -1.6 }) }),
    ]);
    expect(outbox).toEqual([]);
  });

  it("el perfil local más reciente se sube; el consentimiento local no viaja", async () => {
    patientProfileStore.write({
      ...emptyPatientProfile,
      name: "Paciente Prueba",
      age: 58,
      consent,
      updatedAt: "2026-10-09T12:00:00.000Z",
    });

    await runAccountSync(dependencies());
    await deliverOutbox();

    expect(fake.rows("profiles")).toEqual([expect.objectContaining({ name: "Paciente Prueba", age: 58 })]);
    expect(fake.rows("profiles")[0]).not.toHaveProperty("consent");
  });
});

describe("runAccountSync: fallos intermitentes (ningún registro se pierde)", () => {
  it("si un lote falla, el siguiente pase lo reintenta y nada local se borra", async () => {
    painLogStore.write([
      { date: "2026-10-01", painLevel: 3, stiffness: "0-15" },
      { date: "2026-10-02", painLevel: 4, stiffness: "0-15" },
    ]);
    await runAccountSync(dependencies());
    fake.failNext("upsert");

    expect(await deliverOutbox()).toBe(503);
    outbox = []; // la entrada fallida terminó en la cola de errores; el próximo pase la vuelve a planear

    await runAccountSync(dependencies());
    await deliverOutbox();

    expect(painLogStore.getSnapshot()).toHaveLength(2);
    expect(trashStore.getSnapshot()).toEqual([]);
    expect(fake.rows("pain_logs").map((row) => row.log_date).sort()).toEqual(["2026-10-01", "2026-10-02"]);
  });

  it("si leer la cuenta falla, no toca nada local ni encola nada", async () => {
    painLogStore.write([{ date: "2026-10-01", painLevel: 3, stiffness: "0-15" }]);
    const before = JSON.stringify(painLogStore.getSnapshot());
    fake.failNext("select");

    await expect(runAccountSync(dependencies())).resolves.toEqual({ status: "failed" });

    expect(JSON.stringify(painLogStore.getSnapshot())).toBe(before);
    expect(outbox).toEqual([]);
    expect(syncStateStore.getSnapshot().bases).toEqual({});
  });

  it("sin el consentimiento confirmado en la cuenta baja lo remoto pero no sube nada", async () => {
    fake = createFakeSupabase();
    client = fake.client as unknown as RepositoryClient;
    painLogStore.write([{ date: "2026-10-01", painLevel: 3, stiffness: "0-15" }]);
    fake.seed("pain_logs", [{ log_date: "2026-10-02", pain_level: 5, stiffness: "15-30" }]);

    await expect(runAccountSync(dependencies())).resolves.toEqual({ status: "waiting-consent" });

    expect(outbox).toEqual([]);
    expect(painLogStore.getSnapshot()).toHaveLength(2);
  });
});

describe("runAccountSync: pases siguientes", () => {
  it("un borrado en este celular se propaga a la cuenta (en suave)", async () => {
    painLogStore.write([{ date: "2026-10-01", painLevel: 3, stiffness: "0-15" }]);
    await runAccountSync(dependencies());
    await deliverOutbox();
    await runAccountSync(dependencies()); // confirma la base

    softDeletePainLog("2026-10-01");
    await runAccountSync(dependencies());
    await deliverOutbox();

    expect(fake.rows("pain_logs")[0].deleted_at).not.toBeNull();
  });

  it("otra cuenta en el mismo celular empieza sin base: no se infieren borrados", async () => {
    painLogStore.write([{ date: "2026-10-01", painLevel: 3, stiffness: "0-15" }]);
    syncStateStore.write({ userId: USER_B, bases: { painLogs: { "2026-10-01": "[\"2026-10-01\",3,\"0-15\"]" } } });

    await runAccountSync(dependencies());

    expect(painLogStore.getSnapshot()).toHaveLength(1);
    expect(outbox).toEqual([expect.objectContaining({ domain: "painLogs", deletes: [] })]);
    expect(syncStateStore.getSnapshot().userId).toBe(USER_A);
  });

  it("cada lote lleva el consentimiento y no supera el tope", async () => {
    const days = Array.from({ length: 150 }, (_, index) =>
      new Date(Date.UTC(2026, 4, 1 + index)).toISOString().slice(0, 10)
    );
    painLogStore.write(days.map((date) => ({ date, painLevel: 2, stiffness: "0-15" as const })));

    await runAccountSync(dependencies());

    expect(outbox.map((batch) => batch.upserts.length)).toEqual([100, 50]);
    expect(outbox.every((batch) => batch.consent === consent)).toBe(true);
  });
});
