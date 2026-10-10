// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const unregisterSentHandler = vi.hoisted(() => vi.fn());
const outboxMocks = vi.hoisted(() => ({
  flushOutbox: vi.fn(() => Promise.resolve()),
  purgeExpiredDeadLetters: vi.fn(),
  registerOutboxSentHandler: vi.fn(() => unregisterSentHandler),
}));

vi.mock("@/lib/api/outbox", () => outboxMocks);

import { OUTBOX_POLL_INTERVAL_MS, OutboxSync } from "./OutboxSync";

beforeEach(() => {
  vi.useFakeTimers();
  outboxMocks.flushOutbox.mockClear();
  outboxMocks.purgeExpiredDeadLetters.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("OutboxSync", () => {
  it("instala el manejador del código final de las citas y lo quita al desmontarse", () => {
    const { unmount } = render(<OutboxSync />);

    expect(outboxMocks.registerOutboxSentHandler).toHaveBeenCalledWith("/api/appointments", expect.any(Function));
    unmount();
    expect(unregisterSentHandler).toHaveBeenCalledTimes(1);
  });

  it("purges old dead letters and flushes on mount", () => {
    render(<OutboxSync />);

    expect(outboxMocks.purgeExpiredDeadLetters).toHaveBeenCalledOnce();
    expect(outboxMocks.flushOutbox).toHaveBeenCalledOnce();
  });

  it("flushes ignoring backoff when the connection comes back", () => {
    render(<OutboxSync />);

    window.dispatchEvent(new Event("online"));

    expect(outboxMocks.flushOutbox).toHaveBeenLastCalledWith({ ignoreBackoff: true });
  });

  it("retries due entries periodically and stops after unmount", () => {
    const { unmount } = render(<OutboxSync />);

    vi.advanceTimersByTime(OUTBOX_POLL_INTERVAL_MS);
    expect(outboxMocks.flushOutbox).toHaveBeenCalledTimes(2);

    unmount();
    vi.advanceTimersByTime(OUTBOX_POLL_INTERVAL_MS * 3);
    window.dispatchEvent(new Event("online"));
    expect(outboxMocks.flushOutbox).toHaveBeenCalledTimes(2);
  });
});
