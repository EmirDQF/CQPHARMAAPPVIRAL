// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createConsentRecord } from "../privacy/consent";
import {
  OUTBOX_BASE_RETRY_DELAY_MS,
  OUTBOX_DEAD_LETTER_LIMIT,
  OUTBOX_DEAD_LETTER_MAX_AGE_MS,
  OUTBOX_DEAD_LETTER_STORAGE_KEY,
  OUTBOX_MAX_RETRY_DELAY_MS,
  OUTBOX_MAX_SERVER_FAILURES,
  computeRetryDelayMs,
  deadLetterStore,
  enqueueOutboxRequest,
  flushOutbox,
  outboxStore,
  parseDeadLetters,
  parseOutboxEntries,
  purgeExpiredDeadLetters,
  retryDeadLetter,
  type DeadLetterEntry,
} from "./outbox";

const NOW = new Date("2026-09-24T15:00:00Z").getTime();
const DAY_MS = 24 * 60 * 60_000;
const PHONE = "987654321";
const noJitter = () => 0;

const anonymousLead = { chronologicalAge: 52, articularAge: 63, riskLevel: "moderado" };
const consentedAppointment = {
  serviceId: "densitometria",
  date: "2026-09-25",
  slot: "manana",
  patient: { name: "María Torres", age: 58, phone: PHONE, bookedBy: "propia" },
  consent: createConsentRecord(new Date(NOW)),
};

function mockFetch(...responses: Array<number | Error | Response>) {
  const fetchMock = vi.fn<typeof fetch>();
  for (const response of responses) {
    if (response instanceof Error) fetchMock.mockRejectedValueOnce(response);
    else if (response instanceof Response) fetchMock.mockResolvedValueOnce(response);
    else fetchMock.mockResolvedValueOnce(new Response(null, { status: response }));
  }
  return fetchMock;
}

function queueLead(now = NOW) {
  enqueueOutboxRequest("/api/leads", anonymousLead, { containsPersonalData: false, now });
}

function deadLetter(overrides: Partial<DeadLetterEntry> = {}): DeadLetterEntry {
  return {
    id: crypto.randomUUID(),
    endpoint: "/api/leads",
    body: anonymousLead,
    containsPersonalData: false,
    status: 422,
    failedAt: NOW,
    ...overrides,
  };
}

let consoleError: ReturnType<typeof vi.spyOn>;
let consoleWarn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  outboxStore.write([]);
  deadLetterStore.write([]);
  consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("enqueueOutboxRequest", () => {
  it("refuses to queue personal data without consent", () => {
    const withoutConsent = { ...consentedAppointment, consent: undefined };

    const queued = enqueueOutboxRequest("/api/appointments", withoutConsent, {
      containsPersonalData: true,
      now: NOW,
    });

    expect(queued).toBe(false);
    expect(outboxStore.getSnapshot()).toEqual([]);
  });

  it("queues personal data when the payload carries consent", () => {
    expect(
      enqueueOutboxRequest("/api/appointments", consentedAppointment, {
        containsPersonalData: true,
        now: NOW,
      })
    ).toBe(true);
    expect(outboxStore.getSnapshot()).toHaveLength(1);
  });

  it("does not mutate the previous snapshot", () => {
    queueLead();
    const before = outboxStore.getSnapshot();

    queueLead();

    expect(before).toHaveLength(1);
    expect(outboxStore.getSnapshot()).toHaveLength(2);
  });
});

describe("endpoints de respaldo (C3)", () => {
  it("encola lotes de /api/sync con consentimiento y sobreviven a la relectura", () => {
    const batch = { domain: "painLogs", upserts: [], deletes: [], consent: createConsentRecord(new Date(NOW)) };

    expect(enqueueOutboxRequest("/api/sync", batch, { containsPersonalData: true, now: NOW })).toBe(true);
    expect(enqueueOutboxRequest("/api/consents", { purpose: "respaldo-cuenta" }, { containsPersonalData: false, now: NOW })).toBe(true);

    expect(parseOutboxEntries(outboxStore.getSnapshot())?.map((entry) => entry.endpoint)).toEqual([
      "/api/sync",
      "/api/consents",
    ]);
  });

  it("un lote de /api/sync sin consentimiento no se encola (Ley 29733)", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const queued = enqueueOutboxRequest("/api/sync", { domain: "painLogs" }, { containsPersonalData: true, now: NOW });

    expect(queued).toBe(false);
  });
});

describe("computeRetryDelayMs", () => {
  it("grows exponentially from the base delay and stops at the cap", () => {
    expect(computeRetryDelayMs(1, () => 1)).toBe(OUTBOX_BASE_RETRY_DELAY_MS);
    expect(computeRetryDelayMs(2, () => 1)).toBe(OUTBOX_BASE_RETRY_DELAY_MS * 2);
    expect(computeRetryDelayMs(50, () => 1)).toBe(OUTBOX_MAX_RETRY_DELAY_MS);
  });

  it("applies jitter within the upper half of the exponential window", () => {
    const window = OUTBOX_BASE_RETRY_DELAY_MS * 4;
    expect(computeRetryDelayMs(3, () => 0)).toBe(window / 2);
    expect(computeRetryDelayMs(3, () => 0.5)).toBe(window * 0.75);
  });
});

describe("flushOutbox · success", () => {
  it("sends due entries and removes them on 2xx", async () => {
    queueLead();
    const fetchMock = mockFetch(201);

    await flushOutbox({ now: NOW, fetchImpl: fetchMock });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/leads");
    expect(outboxStore.getSnapshot()).toEqual([]);
    expect(deadLetterStore.getSnapshot()).toEqual([]);
  });

  it("does not send the same entry twice when flushes overlap", async () => {
    queueLead();
    const fetchMock = mockFetch(201, 201);

    await Promise.all([
      flushOutbox({ now: NOW, fetchImpl: fetchMock }),
      flushOutbox({ now: NOW, fetchImpl: fetchMock }),
    ]);

    expect(fetchMock).toHaveBeenCalledOnce();
  });
});

describe("flushOutbox · offline", () => {
  it("does not try to send nor spend attempts while navigator is offline", async () => {
    queueLead();
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);
    const fetchMock = mockFetch();

    await flushOutbox({ now: NOW, fetchImpl: fetchMock });

    expect(fetchMock).not.toHaveBeenCalled();
    const [entry] = outboxStore.getSnapshot();
    expect(entry.attempts).toBe(0);
    expect(entry.nextAttemptAt).toBe(NOW);
  });

  it("reschedules a fetch TypeError with backoff without spending attempts", async () => {
    queueLead();

    for (let retry = 1; retry <= OUTBOX_MAX_SERVER_FAILURES + 2; retry += 1) {
      const [entry] = outboxStore.getSnapshot();
      await flushOutbox({
        now: entry.nextAttemptAt,
        fetchImpl: mockFetch(new TypeError("Failed to fetch")),
        random: noJitter,
      });
    }

    const [entry] = outboxStore.getSnapshot();
    expect(entry.attempts).toBe(0);
    expect(entry.retries).toBe(OUTBOX_MAX_SERVER_FAILURES + 2);
    expect(deadLetterStore.getSnapshot()).toEqual([]);
  });

  it("stops the run after a network error so other entries keep their schedule", async () => {
    queueLead();
    queueLead();
    const fetchMock = mockFetch(new TypeError("Failed to fetch"));

    await flushOutbox({ now: NOW, fetchImpl: fetchMock, random: noJitter });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(outboxStore.getSnapshot()[1].retries).toBe(0);
  });

  it("ignores backoff when forced (connection just came back)", async () => {
    queueLead();
    await flushOutbox({ now: NOW, fetchImpl: mockFetch(new TypeError("x")), random: noJitter });
    const fetchMock = mockFetch(201);

    await flushOutbox({ now: NOW + 1, fetchImpl: fetchMock, ignoreBackoff: true });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(outboxStore.getSnapshot()).toEqual([]);
  });
});

describe("flushOutbox · 5xx", () => {
  it("keeps the entry with growing backoff after a 5xx", async () => {
    queueLead();

    await flushOutbox({ now: NOW, fetchImpl: mockFetch(503), random: noJitter });
    const [first] = outboxStore.getSnapshot();
    expect(first.attempts).toBe(1);
    expect(first.nextAttemptAt).toBe(NOW + OUTBOX_BASE_RETRY_DELAY_MS / 2);

    const notYetDue = mockFetch();
    await flushOutbox({ now: NOW + 1, fetchImpl: notYetDue });
    expect(notYetDue).not.toHaveBeenCalled();

    await flushOutbox({ now: first.nextAttemptAt, fetchImpl: mockFetch(500), random: noJitter });
    const [second] = outboxStore.getSnapshot();
    expect(second.attempts).toBe(2);
    expect(second.nextAttemptAt - first.nextAttemptAt).toBeGreaterThan(first.nextAttemptAt - NOW);
  });

  it("moves the entry to the dead-letter queue after 3 server failures", async () => {
    queueLead();

    for (let failure = 0; failure < OUTBOX_MAX_SERVER_FAILURES; failure += 1) {
      const [entry] = outboxStore.getSnapshot();
      await flushOutbox({ now: entry.nextAttemptAt, fetchImpl: mockFetch(502) });
    }

    expect(OUTBOX_MAX_SERVER_FAILURES).toBe(3);
    expect(outboxStore.getSnapshot()).toEqual([]);
    const [dead] = deadLetterStore.getSnapshot();
    expect(dead).toMatchObject({ endpoint: "/api/leads", status: 502, body: anonymousLead });
  });
});

describe("flushOutbox · 408 and 429", () => {
  it.each([408, 429])("retries %i without spending attempts", async (status) => {
    queueLead();

    for (let retry = 0; retry < OUTBOX_MAX_SERVER_FAILURES + 1; retry += 1) {
      const [entry] = outboxStore.getSnapshot();
      await flushOutbox({ now: entry.nextAttemptAt, fetchImpl: mockFetch(status) });
    }

    const [entry] = outboxStore.getSnapshot();
    expect(entry.attempts).toBe(0);
    expect(entry.nextAttemptAt).toBeGreaterThan(NOW);
    expect(deadLetterStore.getSnapshot()).toEqual([]);
  });

  it("respects Retry-After in seconds", async () => {
    queueLead();
    const throttled = new Response(null, { status: 429, headers: { "Retry-After": "120" } });

    await flushOutbox({ now: NOW, fetchImpl: mockFetch(throttled) });

    expect(outboxStore.getSnapshot()[0].nextAttemptAt).toBe(NOW + 120_000);
  });

  it("respects Retry-After as an HTTP date", async () => {
    queueLead();
    const retryAt = new Date(NOW + 90_000).toUTCString();
    const throttled = new Response(null, { status: 429, headers: { "Retry-After": retryAt } });

    await flushOutbox({ now: NOW, fetchImpl: mockFetch(throttled) });

    expect(outboxStore.getSnapshot()[0].nextAttemptAt).toBe(NOW + 90_000);
  });
});

describe("flushOutbox · other 4xx", () => {
  it.each([400, 409, 422])("moves a %i entry to the dead-letter queue", async (status) => {
    queueLead();

    await flushOutbox({ now: NOW, fetchImpl: mockFetch(status) });

    expect(outboxStore.getSnapshot()).toEqual([]);
    const [dead] = deadLetterStore.getSnapshot();
    expect(dead).toMatchObject({ endpoint: "/api/leads", status, failedAt: NOW });
    expect(Object.keys(dead).sort()).toEqual(
      ["body", "containsPersonalData", "endpoint", "failedAt", "id", "status"].sort()
    );
  });

  it("persists the dead letter under its own storage key", async () => {
    queueLead();

    await flushOutbox({ now: NOW, fetchImpl: mockFetch(422) });

    const stored = JSON.parse(window.localStorage.getItem(OUTBOX_DEAD_LETTER_STORAGE_KEY) ?? "[]");
    expect(OUTBOX_DEAD_LETTER_STORAGE_KEY).toBe("artikare_outbox_dead_v1");
    expect(stored).toHaveLength(1);
  });

  it("never logs the payload", async () => {
    enqueueOutboxRequest("/api/appointments", consentedAppointment, {
      containsPersonalData: true,
      now: NOW,
    });

    await flushOutbox({ now: NOW, fetchImpl: mockFetch(400) });

    const logged = JSON.stringify([...consoleError.mock.calls, ...consoleWarn.mock.calls]);
    expect(logged).not.toContain(PHONE);
    expect(logged).not.toContain("María");
  });
});

describe("dead-letter queue", () => {
  it(`keeps only the newest ${OUTBOX_DEAD_LETTER_LIMIT} entries`, async () => {
    const existing = Array.from({ length: OUTBOX_DEAD_LETTER_LIMIT }, (_, index) =>
      deadLetter({ id: `old-${index}`, failedAt: NOW - OUTBOX_DEAD_LETTER_LIMIT + index })
    );
    deadLetterStore.write(existing);
    queueLead();

    await flushOutbox({ now: NOW, fetchImpl: mockFetch(400) });

    const dead = deadLetterStore.getSnapshot();
    expect(dead).toHaveLength(OUTBOX_DEAD_LETTER_LIMIT);
    expect(dead.some((entry) => entry.id === "old-0")).toBe(false);
    expect(dead.at(-1)?.status).toBe(400);
    expect(existing).toHaveLength(OUTBOX_DEAD_LETTER_LIMIT);
  });

  it("purges entries older than 30 days when writing", async () => {
    deadLetterStore.write([
      deadLetter({ id: "expired", failedAt: NOW - OUTBOX_DEAD_LETTER_MAX_AGE_MS - 1 }),
      deadLetter({ id: "recent", failedAt: NOW - DAY_MS }),
    ]);
    queueLead();

    await flushOutbox({ now: NOW, fetchImpl: mockFetch(409) });

    expect(deadLetterStore.getSnapshot().map((entry) => entry.id)).toEqual([
      "recent",
      expect.any(String),
    ]);
  });

  it("purges entries older than 30 days on demand", () => {
    deadLetterStore.write([
      deadLetter({ id: "expired", failedAt: NOW - 31 * DAY_MS }),
      deadLetter({ id: "recent", failedAt: NOW - 29 * DAY_MS }),
    ]);

    purgeExpiredDeadLetters(NOW);

    expect(deadLetterStore.getSnapshot().map((entry) => entry.id)).toEqual(["recent"]);
  });

  it("purges expired entries and drops corrupt ones when parsing stored data", () => {
    const parsed = parseDeadLetters(
      [
        deadLetter({ id: "expired", failedAt: NOW - 31 * DAY_MS }),
        deadLetter({ id: "ok" }),
        { id: 7, endpoint: "/api/hack" },
        "basura",
      ],
      NOW
    );

    expect(parsed?.map((entry) => entry.id)).toEqual(["ok"]);
    expect(parseDeadLetters({ not: "an array" }, NOW)).toBeNull();
  });

  it("re-queues a dead letter and removes it from the dead-letter queue", async () => {
    deadLetterStore.write([deadLetter({ id: "dead-1" }), deadLetter({ id: "dead-2" })]);

    expect(retryDeadLetter("dead-1", { now: NOW })).toBe(true);

    expect(deadLetterStore.getSnapshot().map((entry) => entry.id)).toEqual(["dead-2"]);
    const [queued] = outboxStore.getSnapshot();
    expect(queued).toMatchObject({ endpoint: "/api/leads", attempts: 0, retries: 0 });
    expect(queued.nextAttemptAt).toBe(NOW);

    const fetchMock = mockFetch(201);
    await flushOutbox({ now: NOW, fetchImpl: fetchMock });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(outboxStore.getSnapshot()).toEqual([]);
  });

  it("returns false for an unknown dead-letter id", () => {
    expect(retryDeadLetter("missing", { now: NOW })).toBe(false);
    expect(outboxStore.getSnapshot()).toEqual([]);
  });

  it("keeps a dead letter whose personal data lost its consent", () => {
    const withoutConsent = { ...consentedAppointment, consent: undefined };
    deadLetterStore.write([
      deadLetter({
        id: "no-consent",
        endpoint: "/api/appointments",
        body: withoutConsent,
        containsPersonalData: true,
      }),
    ]);

    expect(retryDeadLetter("no-consent", { now: NOW })).toBe(false);
    expect(deadLetterStore.getSnapshot()).toHaveLength(1);
  });
});

describe("corrupt localStorage", () => {
  it("drops outbox entries that no longer match the schema", async () => {
    outboxStore.write([{ bogus: true } as never]);
    const fetchMock = mockFetch();

    await flushOutbox({ now: NOW, fetchImpl: fetchMock });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(outboxStore.getSnapshot()).toEqual([]);
  });

  it("parses legacy outbox entries without a retries counter", () => {
    const legacy = {
      id: "legacy",
      endpoint: "/api/leads",
      body: anonymousLead,
      containsPersonalData: false,
      attempts: 1,
      nextAttemptAt: NOW,
    };

    const parsed = parseOutboxEntries([legacy, null, { id: "" }]);

    expect(parsed).toEqual([{ ...legacy, retries: 0 }]);
    expect(parseOutboxEntries("not-json-array")).toBeNull();
  });
});
