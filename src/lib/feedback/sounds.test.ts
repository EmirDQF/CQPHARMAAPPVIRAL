import { describe, expect, it, vi } from "vitest";
import { DEFAULT_FEEDBACK_PREFERENCES, parseFeedbackPreferences } from "./preferences";
import { SOUNDS, playSound, type SoundDependencies } from "./sounds";

function fakeContext() {
  const param = () => ({ setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() });
  const oscillators: { start: ReturnType<typeof vi.fn> }[] = [];
  const context = {
    currentTime: 0,
    state: "running",
    resume: vi.fn(async () => undefined),
    destination: {},
    createOscillator: vi.fn(() => {
      const oscillator = { type: "", frequency: param(), connect: vi.fn((node: unknown) => node), start: vi.fn(), stop: vi.fn() };
      oscillators.push(oscillator);
      return oscillator;
    }),
    createGain: vi.fn(() => ({ gain: param(), connect: vi.fn((node: unknown) => node) })),
  };
  return { context: context as unknown as AudioContext, oscillators };
}

function deps(overrides: Partial<SoundDependencies> = {}): SoundDependencies {
  return {
    readPreferences: () => DEFAULT_FEEDBACK_PREFERENCES,
    isPageHidden: () => false,
    getContext: () => fakeContext().context,
    ...overrides,
  };
}

describe("playSound", () => {
  it("toca una nota por cada una del sonido", () => {
    const { context, oscillators } = fakeContext();
    expect(playSound("celebrate", deps({ getContext: () => context }))).toBe(true);
    expect(oscillators).toHaveLength(SOUNDS.celebrate.length);
  });

  it("no suena si la persona lo apagó, si la app está oculta o si no hay audio", () => {
    expect(playSound("success", deps({ readPreferences: () => ({ ...DEFAULT_FEEDBACK_PREFERENCES, sound: false }) }))).toBe(false);
    expect(playSound("success", deps({ isPageHidden: () => true }))).toBe(false);
    expect(playSound("success", deps({ getContext: () => null }))).toBe(false);
  });

  it("nunca lanza aunque el audio falle", () => {
    const broken = () => {
      throw new Error("sin audio");
    };
    expect(playSound("tap", deps({ getContext: broken }))).toBe(false);
  });

  it("mantiene todos los sonidos cortos y a volumen bajo", () => {
    Object.values(SOUNDS).flat().forEach((item) => {
      expect(item.start + item.duration).toBeLessThanOrEqual(0.8);
      expect(item.volume).toBeLessThanOrEqual(0.2);
    });
  });
});

describe("preferencias de sonido", () => {
  it("vienen encendidas y la v1 (sin interruptor) se migra encendida", () => {
    expect(DEFAULT_FEEDBACK_PREFERENCES.sound).toBe(true);
    expect(parseFeedbackPreferences({ version: 1, haptics: false, sound: false, celebrations: true })).toEqual({
      version: 2,
      haptics: false,
      sound: true,
      celebrations: true,
    });
  });
});
