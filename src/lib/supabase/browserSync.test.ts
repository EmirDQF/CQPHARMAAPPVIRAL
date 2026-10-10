// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { outboxStore } from "@/lib/api/outbox";
import { painLogStore } from "@/lib/dashboard/painLog";
import { syncStateStore } from "@/lib/sync/syncState";
import { createFakeSupabase, type FakeSupabase } from "@/test/fakeSupabase";
import { getBrowserSupabase } from "./client";
import { runBrowserAccountSync } from "./browserSync";

vi.mock("./client", () => ({ getBrowserSupabase: vi.fn() }));

const NOW = new Date("2026-10-10T15:00:00.000Z");
const USER_ID = "00000000-0000-4000-8000-00000000a11c";
const consent = { consentAt: "2026-10-10T12:00:00.000Z", consentVersion: "2026-09-24-provisional" };

let fake: FakeSupabase;

function withSession(user: { id: string; is_anonymous?: boolean } | null) {
  const client = {
    ...fake.client,
    auth: { getSession: vi.fn(async () => ({ data: { session: user ? { user } : null }, error: null })) },
  };
  vi.mocked(getBrowserSupabase).mockReturnValue(client as unknown as ReturnType<typeof getBrowserSupabase>);
  return client;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  // Sin red: la outbox conserva lo encolado para inspeccionarlo.
  vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);
  fake = createFakeSupabase();
  fake.seed("consents", [
    { purpose: "respaldo-cuenta", policy_version: consent.consentVersion, granted_at: consent.consentAt, revoked_at: null },
  ]);
  outboxStore.write([]);
  painLogStore.write([{ date: "2026-10-01", painLevel: 3, stiffness: "0-15" }]);
  syncStateStore.write({ userId: null, bases: {} });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("runBrowserAccountSync", () => {
  it("sin Supabase configurado no hace nada (modo invitado)", async () => {
    vi.mocked(getBrowserSupabase).mockReturnValue(null);

    await expect(runBrowserAccountSync(consent)).resolves.toBeNull();
    expect(outboxStore.getSnapshot()).toEqual([]);
  });

  it("una sesión anónima no respalda", async () => {
    withSession({ id: USER_ID, is_anonymous: true });

    await expect(runBrowserAccountSync(consent)).resolves.toBeNull();
    expect(outboxStore.getSnapshot()).toEqual([]);
  });

  it("con cuenta encola los lotes en /api/sync como datos personales con su consentimiento", async () => {
    withSession({ id: USER_ID });

    await expect(runBrowserAccountSync(consent)).resolves.toMatchObject({ status: "synced", queuedForUpload: 1 });

    expect(outboxStore.getSnapshot()).toEqual([
      expect.objectContaining({
        endpoint: "/api/sync",
        containsPersonalData: true,
        body: expect.objectContaining({ domain: "painLogs", consent }),
      }),
    ]);
  });

  it("dos llamadas simultáneas comparten un solo pase (no duplican lotes)", async () => {
    const client = withSession({ id: USER_ID });

    await Promise.all([runBrowserAccountSync(consent), runBrowserAccountSync(consent)]);

    expect(client.auth.getSession).toHaveBeenCalledTimes(1);
    expect(outboxStore.getSnapshot()).toHaveLength(1);
  });
});
