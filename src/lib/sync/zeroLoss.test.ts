// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleSyncBatch } from "@/lib/api/handleSyncBatch";
import { bottlesStore } from "@/lib/dashboard/bottles";
import { dexaVaultStore } from "@/lib/dashboard/dexaVault";
import { painLogStore } from "@/lib/dashboard/painLog";
import { emptyPatientProfile, patientProfileStore } from "@/lib/dashboard/patientProfile";
import { pillboxStore } from "@/lib/dashboard/pillbox";
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

/**
 * Cero pérdida en la migración celular → cuenta (Fase 1.3). Condición para
 * encender `isAccountSyncAvailable()`: ningún escenario pierde un registro.
 */

const NOW = new Date("2026-10-10T15:00:00.000Z");
const USER = "00000000-0000-4000-8000-00000000a11c";
const consent = { consentAt: "2026-10-10T12:00:00.000Z", consentVersion: "v-test" };

let fake: FakeSupabase;
let client: RepositoryClient;
let outbox: OutgoingSyncBatch[];

function remoteReaders(): AccountSyncDependencies["remote"] {
  return {
    profile: createSupabaseProfileRepository(client),
    painLogs: createSupabasePainLogRepository(client),
    dexaScans: createSupabaseDexaScanRepository(client),
    doseEvents: createSupabaseDoseEventRepository(client),
    bottles: createSupabaseBottleRepository(client),
  };
}

function dependencies(overrides: Partial<AccountSyncDependencies> = {}): AccountSyncDependencies {
  return {
    userId: USER,
    consent,
    local: createLocalSyncRepositories(),
    remote: remoteReaders(),
    isConsentActiveOnServer: () => createSupabaseConsentRepository(client).hasActive("respaldo-cuenta"),
    enqueue: (batch) => {
      outbox.push(batch);
      return true;
    },
    ...overrides,
  };
}

/** Entrega en orden como la outbox; `limit` simula que la app se cierra a la mitad. */
async function deliverOutbox(limit = Number.POSITIVE_INFINITY): Promise<void> {
  let delivered = 0;
  while (outbox.length > 0 && delivered < limit) {
    const result = await handleSyncBatch({ client, requester: { id: USER, isAnonymous: false }, body: outbox[0] });
    if (result.status !== 200) return;
    outbox.shift();
    delivered += 1;
  }
}

function days(count: number, startDay = 1): string[] {
  return Array.from({ length: count }, (_, index) =>
    new Date(Date.UTC(2026, 4, startDay + index)).toISOString().slice(0, 10)
  );
}

function remotePainDates(): string[] {
  return fake
    .rows("pain_logs")
    .filter((row) => row.deleted_at == null)
    .map((row) => String(row.log_date))
    .sort();
}

/** Estado completo de un celular (lo que vive en su localStorage). */
interface DeviceState {
  pain: ReturnType<typeof painLogStore.getSnapshot>;
  dexa: ReturnType<typeof dexaVaultStore.getSnapshot>;
  pillbox: ReturnType<typeof pillboxStore.getSnapshot>;
  bottles: ReturnType<typeof bottlesStore.getSnapshot>;
  profile: ReturnType<typeof patientProfileStore.getSnapshot>;
  trash: ReturnType<typeof trashStore.getSnapshot>;
  sync: ReturnType<typeof syncStateStore.getSnapshot>;
}

function saveDevice(): DeviceState {
  return {
    pain: painLogStore.getSnapshot(),
    dexa: dexaVaultStore.getSnapshot(),
    pillbox: pillboxStore.getSnapshot(),
    bottles: bottlesStore.getSnapshot(),
    profile: patientProfileStore.getSnapshot(),
    trash: trashStore.getSnapshot(),
    sync: syncStateStore.getSnapshot(),
  };
}

function loadDevice(state: DeviceState): void {
  painLogStore.write(state.pain);
  dexaVaultStore.write(state.dexa);
  pillboxStore.write(state.pillbox);
  bottlesStore.write(state.bottles);
  patientProfileStore.write(state.profile);
  trashStore.write(state.trash);
  syncStateStore.write(state.sync);
}

function emptyDevice(): DeviceState {
  return {
    pain: [],
    dexa: [],
    pillbox: { takenDoseIdsByDate: {} },
    bottles: { bottles: [] },
    profile: emptyPatientProfile,
    trash: [],
    sync: { userId: null, bases: {} },
  };
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
  loadDevice(emptyDevice());
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("cero pérdida: corte a la mitad", () => {
  it("si la app se cierra tras el primer lote, el siguiente pase sube lo que faltaba", async () => {
    const logDays = days(150);
    painLogStore.write(logDays.map((date) => ({ date, painLevel: 2, stiffness: "0-15" as const })));

    await runAccountSync(dependencies());
    await deliverOutbox(1); // llegó el lote de 100; la app se cerró antes del segundo
    outbox = []; // peor caso: la cola local también se perdió

    await runAccountSync(dependencies());
    await deliverOutbox();

    expect(remotePainDates()).toEqual(logDays);
    expect(painLogStore.getSnapshot()).toHaveLength(150);
  });

  it("si aplicar lo remoto falla a la mitad, no se guarda la base y el siguiente pase lo completa", async () => {
    painLogStore.write([{ date: "2026-10-01", painLevel: 3, stiffness: "0-15" }]);
    fake.seed("pain_logs", [{ log_date: "2026-10-02", pain_level: 5, stiffness: "15-30" }]);
    const local = createLocalSyncRepositories();
    const brokenLocal = {
      ...local,
      painLogs: { ...local.painLogs, upsertMany: () => Promise.reject(new Error("cuota llena")) },
    };

    await expect(runAccountSync(dependencies({ local: brokenLocal }))).resolves.toEqual({ status: "failed" });
    expect(syncStateStore.getSnapshot().bases).toEqual({});
    expect(painLogStore.getSnapshot()).toEqual([{ date: "2026-10-01", painLevel: 3, stiffness: "0-15" }]);

    outbox = [];
    await runAccountSync(dependencies());
    await deliverOutbox();

    expect(painLogStore.getSnapshot().map((entry) => entry.date).sort()).toEqual(["2026-10-01", "2026-10-02"]);
    expect(remotePainDates()).toEqual(["2026-10-01", "2026-10-02"]);
  });
});

describe("cero pérdida: doble ejecución", () => {
  it("dos pases seguidos antes de entregar no duplican filas ni pierden registros", async () => {
    painLogStore.write(days(5).map((date) => ({ date, painLevel: 4, stiffness: "15-30" as const })));
    pillboxStore.write({ takenDoseIdsByDate: { "2026-10-01": ["morning-collagen", "night-magnesium"] } });

    await runAccountSync(dependencies());
    await runAccountSync(dependencies());
    await deliverOutbox();

    expect(remotePainDates()).toEqual(days(5));
    expect(fake.rows("dose_events")).toHaveLength(2);
    expect(painLogStore.getSnapshot()).toHaveLength(5);
  });

  it("un tercer pase ya sincronizado no encola trabajo ni toca el celular", async () => {
    painLogStore.write([{ date: "2026-10-01", painLevel: 3, stiffness: "0-15" }]);
    await runAccountSync(dependencies());
    await deliverOutbox();
    await runAccountSync(dependencies());
    const before = JSON.stringify(saveDevice());

    outbox = [];
    const outcome = await runAccountSync(dependencies());

    expect(outcome).toEqual({ status: "synced", downloaded: 0, queuedForUpload: 0 });
    expect(outbox).toEqual([]);
    expect(JSON.stringify(saveDevice())).toBe(before);
  });
});

describe("cero pérdida: sin conexión", () => {
  it("si la red cae al leer la cuenta, el celular queda intacto y sin base", async () => {
    painLogStore.write([{ date: "2026-10-01", painLevel: 3, stiffness: "0-15" }]);
    const before = JSON.stringify(saveDevice());
    const offline = () => Promise.reject(new TypeError("Failed to fetch"));
    const remote = { ...remoteReaders(), painLogs: { list: offline } };

    await expect(runAccountSync(dependencies({ remote }))).resolves.toEqual({ status: "failed" });

    expect(JSON.stringify(saveDevice())).toBe(before);
    expect(outbox).toEqual([]);
  });

  it("si no se puede encolar (sin espacio), el siguiente pase vuelve a planear la subida", async () => {
    painLogStore.write([{ date: "2026-10-01", painLevel: 3, stiffness: "0-15" }]);

    await runAccountSync(dependencies({ enqueue: () => false }));
    expect(fake.rows("pain_logs")).toHaveLength(0);

    await runAccountSync(dependencies());
    await deliverOutbox();

    expect(remotePainDates()).toEqual(["2026-10-01"]);
  });
});

describe("cero pérdida: dos dispositivos", () => {
  it("cada celular conserva lo suyo y ambos terminan con la unión", async () => {
    painLogStore.write([{ date: "2026-10-01", painLevel: 3, stiffness: "0-15" }]);
    pillboxStore.write({ takenDoseIdsByDate: { "2026-10-01": ["morning-collagen"] } });
    await runAccountSync(dependencies());
    await deliverOutbox();
    const phoneA = saveDevice();

    loadDevice(emptyDevice());
    painLogStore.write([{ date: "2026-10-02", painLevel: 5, stiffness: "15-30" }]);
    pillboxStore.write({ takenDoseIdsByDate: { "2026-10-01": ["night-magnesium"] } });
    await runAccountSync(dependencies());
    await deliverOutbox();
    const phoneB = saveDevice();

    loadDevice(phoneA);
    await runAccountSync(dependencies());
    await deliverOutbox();

    expect(painLogStore.getSnapshot().map((entry) => entry.date).sort()).toEqual(["2026-10-01", "2026-10-02"]);
    expect(pillboxStore.getSnapshot().takenDoseIdsByDate["2026-10-01"]?.slice().sort()).toEqual([
      "morning-collagen",
      "night-magnesium",
    ]);
    expect(phoneB.pain).toHaveLength(2);
    expect(remotePainDates()).toEqual(["2026-10-01", "2026-10-02"]);
  });

  it("el mismo día editado en ambos: gana el más reciente y el otro queda en la papelera", async () => {
    // La cuenta fecha cada fila al recibirla: cada celular sincroniza justo después de editar.
    vi.setSystemTime(new Date("2026-10-03T08:05:00.000Z"));
    painLogStore.write([{ date: "2026-10-03", painLevel: 2, stiffness: "0-15", updatedAt: "2026-10-03T08:00:00.000Z" }]);
    await runAccountSync(dependencies());
    await deliverOutbox();
    const phoneA = saveDevice();

    vi.setSystemTime(new Date("2026-10-03T09:05:00.000Z"));
    loadDevice(emptyDevice());
    painLogStore.write([{ date: "2026-10-03", painLevel: 6, stiffness: "30+", updatedAt: "2026-10-03T09:00:00.000Z" }]);
    await runAccountSync(dependencies());
    await deliverOutbox();

    loadDevice(phoneA);
    await runAccountSync(dependencies());

    expect(painLogStore.getSnapshot()).toEqual([expect.objectContaining({ date: "2026-10-03", painLevel: 6 })]);
    expect(JSON.stringify(trashStore.getSnapshot())).toContain("2026-10-03");
  });
});
