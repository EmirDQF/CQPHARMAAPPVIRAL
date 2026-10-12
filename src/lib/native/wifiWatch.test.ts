import { describe, expect, it, vi } from "vitest";
import { createWifiTransitionDetector, watchWifiJoins } from "./wifiWatch";

const network = vi.hoisted(() => {
  let listener: ((status: { connected: boolean; connectionType: string }) => void) | null = null;
  return {
    emit: (status: { connected: boolean; connectionType: string }) => listener?.(status),
    remove: vi.fn(async () => undefined),
    Network: {
      getStatus: vi.fn(async () => ({ connected: true, connectionType: "cellular" })),
      addListener: vi.fn(async (_event: string, callback: typeof listener) => {
        listener = callback;
        return { remove: network.remove };
      }),
    },
  };
});
vi.mock("@capacitor/network", () => ({ Network: network.Network }));

describe("Wi-Fi transitions", () => {
  it("fires only when joining Wi-Fi, not while staying on it", () => {
    const joined = createWifiTransitionDetector({ connected: true, connectionType: "cellular" });
    expect(joined({ connected: true, connectionType: "wifi" })).toBe(true);
    expect(joined({ connected: true, connectionType: "wifi" })).toBe(false);
    expect(joined({ connected: false, connectionType: "none" })).toBe(false);
    expect(joined({ connected: true, connectionType: "wifi" })).toBe(true);
  });

  it("ignores Wi-Fi without connection", () => {
    const joined = createWifiTransitionDetector({ connected: false, connectionType: "none" });
    expect(joined({ connected: false, connectionType: "wifi" })).toBe(false);
  });

  it("listens to @capacitor/network and stops listening on cleanup", async () => {
    const onJoin = vi.fn();
    const stop = await watchWifiJoins(onJoin);
    network.emit({ connected: true, connectionType: "wifi" });
    expect(onJoin).toHaveBeenCalledTimes(1);
    stop();
    expect(network.remove).toHaveBeenCalled();
  });
});
