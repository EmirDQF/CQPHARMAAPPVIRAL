import { describe, expect, it, vi } from "vitest";
import { celebrateGoal, type CelebrateDependencies } from "./celebrate";
import { DEFAULT_FEEDBACK_PREFERENCES } from "./preferences";

function deps(overrides: Partial<CelebrateDependencies> = {}): CelebrateDependencies {
  return {
    readPreferences: () => DEFAULT_FEEDBACK_PREFERENCES,
    prefersReducedMotion: () => false,
    fire: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe("celebrateGoal", () => {
  it("fires confetti by default", async () => {
    const d = deps();
    expect(await celebrateGoal(d)).toBe(true);
    expect(d.fire).toHaveBeenCalledWith(expect.objectContaining({ disableForReducedMotion: true }));
  });

  it("respects the 'celebrations off' setting", async () => {
    const d = deps({ readPreferences: () => ({ ...DEFAULT_FEEDBACK_PREFERENCES, celebrations: false }) });
    expect(await celebrateGoal(d)).toBe(false);
    expect(d.fire).not.toHaveBeenCalled();
  });

  it("respects prefers-reduced-motion", async () => {
    const d = deps({ prefersReducedMotion: () => true });
    expect(await celebrateGoal(d)).toBe(false);
    expect(d.fire).not.toHaveBeenCalled();
  });

  it("degrades quietly without a canvas", async () => {
    expect(await celebrateGoal(deps({ fire: vi.fn(async () => Promise.reject(new Error("no canvas"))) }))).toBe(false);
  });
});
