import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RepositoryClient } from "@/lib/repositories/supabaseRows";
import { createFakeSupabase, type FakeSupabase } from "@/test/fakeSupabase";
import { handleConsentGrant } from "./handleConsentGrant";
import type { SyncRequester } from "./handleSyncBatch";

const NOW = new Date("2026-10-10T15:00:00.000Z");
const accountUser: SyncRequester = { id: "00000000-0000-4000-8000-00000000a11c", isAnonymous: false };
const grantBody = {
  purpose: "respaldo-cuenta",
  consent: { consentAt: "2026-10-10T14:59:00.000Z", consentVersion: "2026-09-24-provisional" },
};

let fake: FakeSupabase;

function run(body: unknown, requester: SyncRequester | null = accountUser) {
  return handleConsentGrant({ client: fake.client as unknown as RepositoryClient, requester, body });
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

describe("handleConsentGrant", () => {
  it("registra el consentimiento respaldo-cuenta con la versión y hora en que se dio", async () => {
    await expect(run(grantBody)).resolves.toEqual({ status: 201, data: { purpose: "respaldo-cuenta" } });
    expect(fake.rows("consents")).toEqual([
      expect.objectContaining({
        purpose: "respaldo-cuenta",
        policy_version: "2026-09-24-provisional",
        granted_at: "2026-10-10T14:59:00.000Z",
        revoked_at: null,
      }),
    ]);
  });

  it("sin cuenta responde 401", async () => {
    await expect(run(grantBody, null)).resolves.toMatchObject({ status: 401 });
    await expect(run(grantBody, { ...accountUser, isAnonymous: true })).resolves.toMatchObject({ status: 401 });
    expect(fake.rows("consents")).toEqual([]);
  });

  it("solo acepta la finalidad respaldo-cuenta", async () => {
    await expect(run({ ...grantBody, purpose: "perfil-clinico" })).resolves.toMatchObject({ status: 400 });
  });

  it("rechaza un consentimiento con fecha futura", async () => {
    const future = { ...grantBody, consent: { ...grantBody.consent, consentAt: "2026-10-11T00:00:00.000Z" } };

    await expect(run(future)).resolves.toMatchObject({ status: 400 });
  });

  it("un fallo de la base responde 503 para que la outbox reintente", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fake.failNext("insert");

    await expect(run(grantBody)).resolves.toMatchObject({ status: 503 });
  });
});
