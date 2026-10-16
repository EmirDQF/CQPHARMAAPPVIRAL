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

  it("mantiene los sonidos cortos (salvo la fanfarria) y a volumen bajo", () => {
    Object.entries(SOUNDS)
      .filter(([name]) => name !== "fanfare")
      .flatMap(([, notes]) => notes)
      .forEach((item) => {
        expect(item.start + item.duration).toBeLessThanOrEqual(0.8);
        expect(item.volume).toBeLessThanOrEqual(0.2);
      });
  });

  it("incluye toque, acierto, error suave, fanfarria, racha y cofre", () => {
    for (const name of ["tap", "correct", "softError", "fanfare", "streak", "chest"] as const) {
      expect(SOUNDS[name].length, name).toBeGreaterThan(0);
    }
  });

  it("el acierto es un acorde ascendente", () => {
    const frequencies = SOUNDS.correct.map((item) => item.frequency);
    expect(frequencies).toEqual([...frequencies].sort((a, b) => a - b));
  });

  it("el error suave es grave, breve y nunca punitivo (sin ondas ásperas)", () => {
    SOUNDS.softError.forEach((item) => {
      expect(item.wave).toBe("sine");
      expect(item.volume).toBeLessThanOrEqual(0.12);
      expect(item.start + item.duration).toBeLessThanOrEqual(0.5);
    });
  });

  it("la fanfarria dura cerca de 1.5 s y no sube el volumen", () => {
    const end = Math.max(...SOUNDS.fanfare.map((item) => item.start + item.duration));
    expect(end).toBeGreaterThanOrEqual(1.3);
    expect(end).toBeLessThanOrEqual(1.7);
    SOUNDS.fanfare.forEach((item) => expect(item.volume).toBeLessThanOrEqual(0.2));
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
