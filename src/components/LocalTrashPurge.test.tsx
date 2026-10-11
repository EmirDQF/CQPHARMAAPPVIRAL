// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocalTrashPurge } from "./LocalTrashPurge";

const mocks = vi.hoisted(() => ({ purgeExpiredTrash: vi.fn<(now: Date) => number>(() => 0) }));

vi.mock("@/lib/storage/trash", () => ({ purgeExpiredTrash: mocks.purgeExpiredTrash }));

beforeEach(() => {
  vi.clearAllMocks();
});

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", { configurable: true, value: state });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("LocalTrashPurge", () => {
  it("purges expired trash when the app opens", () => {
    render(<LocalTrashPurge />);
    expect(mocks.purgeExpiredTrash).toHaveBeenCalledTimes(1);
    expect(mocks.purgeExpiredTrash.mock.calls[0]?.[0]).toBeInstanceOf(Date);
  });

  it("purges again when the app returns to the foreground, and stops after unmount", () => {
    const { unmount } = render(<LocalTrashPurge />);

    setVisibility("hidden");
    setVisibility("visible");
    expect(mocks.purgeExpiredTrash).toHaveBeenCalledTimes(2);

    unmount();
    setVisibility("visible");
    expect(mocks.purgeExpiredTrash).toHaveBeenCalledTimes(2);
  });
});
