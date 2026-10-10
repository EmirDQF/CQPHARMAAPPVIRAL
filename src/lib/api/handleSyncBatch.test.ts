import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RepositoryClient } from "@/lib/repositories/supabaseRows";
import { createFakeSupabase, type FakeSupabase } from "@/test/fakeSupabase";
import { handleSyncBatch, type SyncRequester } from "./handleSyncBatch";

const NOW = new Date("2026-10-10T15:00:00.000Z");
const consent = { consentAt: "2026-10-10T12:00:00.000Z", consentVersion: "2026-09-24-provisional" };
const accountUser: SyncRequester = { id: "00000000-0000-4000-8000-00000000a11c", isAnonymous: false };
const painBatch = {
  domain: "painLogs",
  upserts: [{ date: "2026-10-01", painLevel: 7, stiffness: "30+" }],
  deletes: [],
  consent,
};

let fake: FakeSupabase;

function grantBackupConsent() {
  fake.seed("consents", [
    {
      purpose: "respaldo-cuenta",
      policy_version: consent.consentVersion,
      granted_at: consent.consentAt,
      revoked_at: null,
    },
  ]);
}

function run(body: unknown, requester: SyncRequester | null = accountUser) {
  return handleSyncBatch({ client: fake.client as unknown as RepositoryClient, requester, body });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  fake = createFakeSupabase();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("handleSyncBatch", () => {
  it("sin sesión responde 401 y no escribe nada", async () => {
    grantBackupConsent();

    await expect(run(painBatch, null)).resolves.toMatchObject({ status: 401 });
    expect(fake.rows("pain_logs")).toEqual([]);
  });

  it("una sesión anónima no respalda: el respaldo es de la cuenta", async () => {
    grantBackupConsent();

    await expect(run(painBatch, { ...accountUser, isAnonymous: true })).resolves.toMatchObject({ status: 401 });
  });

  it("un cuerpo inválido responde 400 sin eco de los valores", async () => {
    grantBackupConsent();

    const result = await run({ ...painBatch, upserts: [{ date: "ayer", painLevel: "7" }] });

    expect(result.status).toBe(400);
    expect(JSON.stringify(result)).not.toContain('"7"');
  });

  it("sin el consentimiento respaldo-cuenta en la base responde 403 (no confía en el cuerpo)", async () => {
    await expect(run(painBatch)).resolves.toMatchObject({ status: 403 });
    expect(fake.rows("pain_logs")).toEqual([]);
  });

  it("con el consentimiento revocado responde 403", async () => {
    grantBackupConsent();
    fake.seed("consents", [
      {
        purpose: "respaldo-cuenta",
        policy_version: consent.consentVersion,
        granted_at: consent.consentAt,
        revoked_at: "2026-10-10T13:00:00.000Z",
      },
    ]);

    await expect(run(painBatch)).resolves.toMatchObject({ status: 403 });
  });

  it("con cuenta y consentimiento guarda el lote y solo devuelve conteos", async () => {
    grantBackupConsent();

    const result = await run(painBatch);

    expect(result).toEqual({ status: 200, data: { domain: "painLogs", upserted: 1, deleted: 0 } });
    expect(fake.rows("pain_logs")).toEqual([expect.objectContaining({ log_date: "2026-10-01", pain_level: 7 })]);
  });

  it("reenviar el mismo lote (reintento de la outbox) no duplica nada", async () => {
    grantBackupConsent();

    await run(painBatch);
    await run(painBatch);

    expect(fake.rows("pain_logs")).toHaveLength(1);
  });

  it("aplica los borrados del lote en suave", async () => {
    grantBackupConsent();
    await run(painBatch);

    await run({ ...painBatch, upserts: [], deletes: ["2026-10-01"] });

    expect(fake.rows("pain_logs")[0].deleted_at).not.toBeNull();
  });

  it("un fallo de la base responde 503 para que la outbox reintente", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    grantBackupConsent();
    fake.failNext("upsert");

    await expect(run(painBatch)).resolves.toMatchObject({ status: 503 });
  });

  it("guarda tomas y frascos con la regla de unión", async () => {
    grantBackupConsent();

    await run({ domain: "doseEvents", upserts: [{ date: "2026-10-09", doseId: "morning-collagen" }], deletes: [], consent });
    await run({
      domain: "bottles",
      upserts: [{ productId: "citrato-magnesio-d3", startedOn: "2026-09-01" }],
      deletes: [],
      consent,
    });

    expect(fake.rows("dose_events")).toHaveLength(1);
    expect(fake.rows("bottles")).toHaveLength(1);
  });
});
