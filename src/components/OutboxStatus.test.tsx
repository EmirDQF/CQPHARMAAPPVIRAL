// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deadLetterStore,
  enqueueOutboxRequest,
  outboxStore,
  type DeadLetterEntry,
} from "@/lib/api/outbox";
import { OutboxStatus } from "./OutboxStatus";

const anonymousLead = { chronologicalAge: 52, articularAge: 63, riskLevel: "moderado" };

function queueLeads(count: number) {
  for (let index = 0; index < count; index += 1) {
    enqueueOutboxRequest("/api/leads", anonymousLead, { containsPersonalData: false });
  }
}

function deadLetter(id: string): DeadLetterEntry {
  return {
    id,
    endpoint: "/api/leads",
    body: anonymousLead,
    containsPersonalData: false,
    status: 422,
    failedAt: Date.now(),
  };
}

function setOnline(online: boolean) {
  vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(online);
  act(() => {
    window.dispatchEvent(new Event(online ? "online" : "offline"));
  });
}

beforeEach(() => {
  outboxStore.write([]);
  deadLetterStore.write([]);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("OutboxStatus", () => {
  it("stays empty when there is nothing pending and the device is online", () => {
    render(<OutboxStatus />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toBeEmptyDOMElement();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("announces a single pending item in singular", () => {
    queueLeads(1);
    render(<OutboxStatus />);

    expect(screen.getByRole("status")).toHaveTextContent("1 pendiente de enviar");
  });

  it("announces several pending items and updates when the queue changes", () => {
    queueLeads(3);
    render(<OutboxStatus />);
    expect(screen.getByRole("status")).toHaveTextContent("3 pendientes de enviar");

    act(() => outboxStore.write([]));

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("tells the user when the device is offline", () => {
    queueLeads(2);
    render(<OutboxStatus />);

    setOnline(false);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Sin conexión");
    expect(status).toHaveTextContent("2 pendientes de enviar");
  });

  it("offers to retry an item from the error queue and removes it from there", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 503 }));
    deadLetterStore.write([deadLetter("dead-1")]);
    render(<OutboxStatus />);

    expect(screen.getByText(/No pudimos enviar 1 registro/)).toBeInTheDocument();
    const retryButton = screen.getByRole("button", { name: /Reintentar/ });
    expect(retryButton.className).toMatch(/min-h-12/);

    fireEvent.click(retryButton);

    expect(deadLetterStore.getSnapshot()).toEqual([]);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(outboxStore.getSnapshot()).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /Reintentar/ })).not.toBeInTheDocument();
  });

  it("does not crash when localStorage holds corrupt data", async () => {
    window.localStorage.setItem("artikare_outbox_dead_v1", "{not json");
    window.localStorage.setItem("artikare_outbox_v1", JSON.stringify([{ bogus: true }, 7]));
    // Módulos frescos para que los stores lean de localStorage desde cero.
    vi.resetModules();
    const testingLibrary = await import("@testing-library/react");
    const { OutboxStatus: FreshOutboxStatus } = await import("./OutboxStatus");

    testingLibrary.render(<FreshOutboxStatus />);

    expect(testingLibrary.screen.getByRole("status")).toBeEmptyDOMElement();
    testingLibrary.cleanup();
  });
});
