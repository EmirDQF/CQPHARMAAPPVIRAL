// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createConsentRecord } from "../privacy/consent";
import {
  OUTBOX_MAX_ATTEMPTS,
  enqueueOutboxRequest,
  flushOutbox,
  outboxStore,
} from "./outbox";

const NOW = new Date("2026-09-24T15:00:00Z").getTime();
const PHONE = "987654321";

const anonymousLead = { chronologicalAge: 52, articularAge: 63, riskLevel: "moderado" };
const consentedAppointment = {
  serviceId: "densitometria",
  date: "2026-09-25",
  slot: "manana",
  patient: { name: "María Torres", age: 58, phone: PHONE, bookedBy: "propia" },
  consent: createConsentRecord(new Date(NOW)),
};

function mockFetch(...responses: Array<number | Error>) {
  const fetchMock = vi.fn<typeof fetch>();
  for (const response of responses) {
    if (response instanceof Error) fetchMock.mockRejectedValueOnce(response);
    else fetchMock.mockResolvedValueOnce(new Response(null, { status: response }));
  }
  return fetchMock;
}

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  outboxStore.write([]);
  consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  consoleError.mockRestore();
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
});

describe("flushOutbox", () => {
  it("sends due entries and removes them on success", async () => {
    enqueueOutboxRequest("/api/leads", anonymousLead, { containsPersonalData: false, now: NOW });
    const fetchMock = mockFetch(201);

    await flushOutbox({ now: NOW, fetchImpl: fetchMock });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/leads");
    expect(outboxStore.getSnapshot()).toEqual([]);
  });

  it("keeps the entry with growing backoff after a 5xx or a network error", async () => {
    enqueueOutboxRequest("/api/leads", anonymousLead, { containsPersonalData: false, now: NOW });

    await flushOutbox({ now: NOW, fetchImpl: mockFetch(503) });
    const [afterServerError] = outboxStore.getSnapshot();
    expect(afterServerError.attempts).toBe(1);
    expect(afterServerError.nextAttemptAt).toBeGreaterThan(NOW);

    const notYetDue = mockFetch();
    await flushOutbox({ now: NOW + 1, fetchImpl: notYetDue });
    expect(notYetDue).not.toHaveBeenCalled();

    await flushOutbox({
      now: afterServerError.nextAttemptAt,
      fetchImpl: mockFetch(new TypeError("Failed to fetch")),
    });
    const [afterNetworkError] = outboxStore.getSnapshot();
    expect(afterNetworkError.attempts).toBe(2);
    expect(afterNetworkError.nextAttemptAt - afterServerError.nextAttemptAt).toBeGreaterThan(
      afterServerError.nextAttemptAt - NOW
    );
  });

  it("drops a 4xx entry and logs without the payload", async () => {
    enqueueOutboxRequest("/api/appointments", consentedAppointment, {
      containsPersonalData: true,
      now: NOW,
    });

    await flushOutbox({ now: NOW, fetchImpl: mockFetch(400) });

    expect(outboxStore.getSnapshot()).toEqual([]);
    expect(consoleError).toHaveBeenCalled();
    const logged = JSON.stringify(consoleError.mock.calls);
    expect(logged).not.toContain(PHONE);
    expect(logged).not.toContain("María");
  });

  it("drops the entry after the maximum number of attempts", async () => {
    enqueueOutboxRequest("/api/leads", anonymousLead, { containsPersonalData: false, now: NOW });

    for (let attempt = 0; attempt < OUTBOX_MAX_ATTEMPTS; attempt += 1) {
      const [entry] = outboxStore.getSnapshot();
      await flushOutbox({ now: entry.nextAttemptAt, fetchImpl: mockFetch(500) });
    }

    expect(outboxStore.getSnapshot()).toEqual([]);
    expect(consoleError).toHaveBeenCalled();
  });

  it("does not send the same entry twice when flushes overlap", async () => {
    enqueueOutboxRequest("/api/leads", anonymousLead, { containsPersonalData: false, now: NOW });
    const fetchMock = mockFetch(201, 201);

    await Promise.all([
      flushOutbox({ now: NOW, fetchImpl: fetchMock }),
      flushOutbox({ now: NOW, fetchImpl: fetchMock }),
    ]);

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("discards stored entries that no longer match the outbox schema", async () => {
    outboxStore.write([{ bogus: true } as never]);
    const fetchMock = mockFetch();

    await flushOutbox({ now: NOW, fetchImpl: fetchMock });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(outboxStore.getSnapshot()).toEqual([]);
  });
});
