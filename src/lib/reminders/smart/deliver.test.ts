import { describe, expect, it, vi } from "vitest";
import { deliverNudge, type DeliverDependencies } from "./deliver";
import { PAUSE_MESSAGE } from "./messages";

vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => false } }));

function deps(overrides: Partial<DeliverDependencies> = {}): DeliverDependencies {
  return { isNativeApp: () => false, showNative: vi.fn(async () => true), showWeb: vi.fn(async () => true), ...overrides };
}

describe("deliverNudge", () => {
  it("uses the native plugin inside the app, one second from now", async () => {
    const d = deps({ isNativeApp: () => true });
    const now = new Date("2026-10-11T20:00:00Z");
    expect(await deliverNudge(PAUSE_MESSAGE, now, d)).toBe(true);
    expect(d.showNative).toHaveBeenCalledWith(PAUSE_MESSAGE, new Date("2026-10-11T20:00:01Z"));
  });

  it("uses the service worker on the web", async () => {
    const d = deps();
    await deliverNudge(PAUSE_MESSAGE, new Date(), d);
    expect(d.showWeb).toHaveBeenCalledWith(PAUSE_MESSAGE);
  });

  it("reports false instead of throwing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(await deliverNudge(PAUSE_MESSAGE, new Date(), deps({ showWeb: vi.fn(async () => Promise.reject(new Error("x"))) }))).toBe(false);
  });
});
