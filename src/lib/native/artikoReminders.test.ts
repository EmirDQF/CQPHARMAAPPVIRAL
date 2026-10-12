import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SMART_REMINDERS } from "../reminders/smart/settings";
import { buildNativeNudgeState, readNativeSentNudges, syncNativeNudgeState, type ArtikoRemindersPlugin } from "./artikoReminders";

const platform = vi.hoisted(() => ({ value: "android" }));
vi.mock("@capacitor/core", () => ({
  Capacitor: { getPlatform: () => platform.value },
  registerPlugin: () => ({}),
}));

const TODAY = "2026-10-11";

function fakePlugin(): ArtikoRemindersPlugin {
  return { configure: vi.fn(async () => undefined), getSent: vi.fn(async () => ({ sent: [{ date: TODAY, slot: "morning" }] })) };
}

const state = buildNativeNudgeState({
  settings: { ...DEFAULT_SMART_REMINDERS, wifiNudges: true, sent: [{ date: TODAY, slot: "afternoon", messageId: "afternoon-1" }] },
  today: TODAY,
  pendingMissions: 2,
  lastOpenedOn: TODAY,
  streakDays: 0,
  doseRemindersPerDay: 2,
});

afterEach(() => {
  platform.value = "android";
});

describe("native Wi-Fi nudge bridge", () => {
  it("hands the worker today's state, caps and ready-made generic texts", () => {
    expect(state).toMatchObject({
      enabled: true,
      date: TODAY,
      pendingMissions: 2,
      maxPerDay: 1,
      sentSlotsToday: ["afternoon"],
      quietStartMinutes: 22 * 60,
      quietEndMinutes: 7 * 60,
      pauseAfterDays: 3,
      title: "Artikare",
    });
    expect(state.messages.morning.length).toBeGreaterThanOrEqual(7);
    expect(JSON.stringify(state.messages)).not.toMatch(/\{streak\}|racha de 0/);
  });

  it("configures the plugin on Android and reads what it sent", async () => {
    const plugin = fakePlugin();
    expect(await syncNativeNudgeState(state, plugin)).toBe(true);
    expect(plugin.configure).toHaveBeenCalledWith(state);
    expect(await readNativeSentNudges(plugin)).toEqual([{ date: TODAY, slot: "morning" }]);
  });

  it("does nothing on the web or iOS", async () => {
    platform.value = "web";
    const plugin = fakePlugin();
    expect(await syncNativeNudgeState(state, plugin)).toBe(false);
    expect(await readNativeSentNudges(plugin)).toEqual([]);
    expect(plugin.configure).not.toHaveBeenCalled();
  });

  it("never throws if the native side fails", async () => {
    const plugin: ArtikoRemindersPlugin = { configure: vi.fn(async () => Promise.reject(new Error("x"))), getSent: vi.fn(async () => Promise.reject(new Error("x"))) };
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(await syncNativeNudgeState(state, plugin)).toBe(false);
    expect(await readNativeSentNudges(plugin)).toEqual([]);
  });
});
