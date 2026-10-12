import { describe, expect, it, vi } from "vitest";
import { HAPTIC_VIBRATION_MS, triggerHaptic, type HapticDependencies } from "./haptics";
import { DEFAULT_FEEDBACK_PREFERENCES, parseFeedbackPreferences } from "./preferences";

function fakeDeps(overrides: Partial<HapticDependencies> = {}): HapticDependencies {
  return {
    isNativeApp: () => false,
    readPreferences: () => DEFAULT_FEEDBACK_PREFERENCES,
    nativeImpact: vi.fn(async () => undefined),
    vibrate: vi.fn(() => true),
    ...overrides,
  };
}

describe("triggerHaptic", () => {
  it("uses the native plugin inside the app", async () => {
    const deps = fakeDeps({ isNativeApp: () => true });
    await triggerHaptic("success", deps);
    expect(deps.nativeImpact).toHaveBeenCalledWith("success");
    expect(deps.vibrate).not.toHaveBeenCalled();
  });

  it("falls back to navigator.vibrate on the web", async () => {
    const deps = fakeDeps();
    await triggerHaptic("light", deps);
    expect(deps.vibrate).toHaveBeenCalledWith(HAPTIC_VIBRATION_MS.light);
  });

  it("does nothing when the person turned vibration off", async () => {
    const deps = fakeDeps({
      isNativeApp: () => true,
      readPreferences: () => ({ ...DEFAULT_FEEDBACK_PREFERENCES, haptics: false }),
    });
    await triggerHaptic("medium", deps);
    expect(deps.nativeImpact).not.toHaveBeenCalled();
    expect(deps.vibrate).not.toHaveBeenCalled();
  });

  it("never throws when the plugin fails (a missing vibration is not an error for the person)", async () => {
    const deps = fakeDeps({ isNativeApp: () => true, nativeImpact: vi.fn(async () => Promise.reject(new Error("x"))) });
    await expect(triggerHaptic("light", deps)).resolves.toBeUndefined();
  });

  it("tolerates browsers without vibration", async () => {
    const deps = fakeDeps({ vibrate: undefined });
    await expect(triggerHaptic("light", deps)).resolves.toBeUndefined();
  });
});

describe("parseFeedbackPreferences", () => {
  it("defaults to haptics on, sound off and celebrations on", () => {
    expect(DEFAULT_FEEDBACK_PREFERENCES).toEqual({ version: 1, haptics: true, sound: false, celebrations: true });
  });

  it("keeps valid fields and repairs the rest", () => {
    expect(parseFeedbackPreferences({ version: 1, haptics: false, sound: "x", celebrations: false })).toEqual({
      version: 1,
      haptics: false,
      sound: false,
      celebrations: false,
    });
  });

  it("rejects unknown future versions so they are not overwritten", () => {
    expect(parseFeedbackPreferences({ version: 9, haptics: false })).toBeNull();
  });
});

describe("triggerHaptic with the real environment", () => {
  it("reads the saved preferences and vibrates in the browser", async () => {
    const vibrate = vi.fn(() => true);
    vi.stubGlobal("navigator", { vibrate });
    await triggerHaptic("medium");
    expect(vibrate).toHaveBeenCalledWith(HAPTIC_VIBRATION_MS.medium);
    vi.unstubAllGlobals();
  });
});
