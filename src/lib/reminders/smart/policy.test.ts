import { describe, expect, it } from "vitest";
import { DEFAULT_SMART_REMINDERS, parseSmartReminders, type SmartRemindersSettings } from "./settings";
import { DOSE_REMINDERS_PER_DAY, decideNudge, isQuietTime, nudgesAllowedPerDay, slotOf, type NudgeContext } from "./policy";

const TODAY = "2026-10-11";
const at = (time: string, date = TODAY) => new Date(`${date}T${time}:00-05:00`);
const ON: SmartRemindersSettings = { ...DEFAULT_SMART_REMINDERS, wifiNudges: true };

function context(overrides: Partial<NudgeContext> = {}): NudgeContext {
  return {
    now: at("15:00"),
    today: TODAY,
    settings: ON,
    pendingMissions: 3,
    lastOpenedOn: "2026-10-10",
    streakDays: 4,
    doseRemindersPerDay: DOSE_REMINDERS_PER_DAY,
    ...overrides,
  };
}

describe("decideNudge (Wi-Fi)", () => {
  it("is opt-in: off by default", () => {
    expect(DEFAULT_SMART_REMINDERS.wifiNudges).toBe(false);
    expect(decideNudge("wifi", context({ settings: DEFAULT_SMART_REMINDERS }))).toEqual({ send: false, reason: "disabled" });
  });

  it("sends a generic afternoon message when missions are pending", () => {
    const decision = decideNudge("wifi", context());
    expect(decision).toMatchObject({ send: true, slot: "afternoon" });
    expect(decision.send && decision.message.title).toBe("Artikare");
  });

  it("respects 'Silenciar hoy'", () => {
    expect(decideNudge("wifi", context({ settings: { ...ON, silencedOn: TODAY } }))).toEqual({ send: false, reason: "silenced" });
  });

  it("stays quiet from 22:00 to 07:00", () => {
    expect(decideNudge("wifi", context({ now: at("22:00") }))).toMatchObject({ reason: "quiet-hours" });
    expect(decideNudge("wifi", context({ now: at("06:59") }))).toMatchObject({ reason: "quiet-hours" });
    expect(decideNudge("wifi", context({ now: at("07:00") })).send).toBe(true);
    expect(isQuietTime(at("21:59"))).toBe(false);
  });

  it("caps everything at 3 a day counting the two dose reminders", () => {
    expect(nudgesAllowedPerDay(DOSE_REMINDERS_PER_DAY)).toBe(1);
    const settings = { ...ON, sent: [{ date: TODAY, slot: "morning" as const, messageId: "morning-1" }] };
    expect(decideNudge("wifi", context({ settings }))).toEqual({ send: false, reason: "daily-cap" });
    expect(decideNudge("wifi", context({ settings, doseRemindersPerDay: 0 })).send).toBe(true);
  });

  it("insists at most once per time slot", () => {
    const settings = { ...ON, sent: [{ date: TODAY, slot: "afternoon" as const, messageId: "afternoon-1" }] };
    expect(decideNudge("wifi", context({ settings, doseRemindersPerDay: 0 }))).toEqual({ send: false, reason: "slot-used" });
  });

  it("never nudges when the day is already complete", () => {
    expect(decideNudge("wifi", context({ pendingMissions: 0 }))).toEqual({ send: false, reason: "day-complete" });
  });

  it("says a kind goodbye once after 3 days away, then pauses", () => {
    const first = decideNudge("wifi", context({ lastOpenedOn: "2026-10-08" }));
    expect(first).toMatchObject({ send: true, slot: "pause" });
    expect(first.send && first.message.body).toBe("Aquí estaré cuando quieras volver 🦸");
    const settings = { ...ON, sent: [{ date: "2026-10-10", slot: "pause" as const, messageId: "pause-1" }] };
    expect(decideNudge("wifi", context({ lastOpenedOn: "2026-10-08", settings }))).toEqual({ send: false, reason: "paused" });
  });

  it("maps Lima time to morning, afternoon and evening", () => {
    expect([slotOf(at("08:00")), slotOf(at("12:00")), slotOf(at("18:00"))]).toEqual(["morning", "afternoon", "evening"]);
  });
});

describe("parseSmartReminders", () => {
  it("repairs broken fields and refuses unknown versions", () => {
    expect(parseSmartReminders({ version: 1, wifiNudges: "yes", sent: [{ date: "x" }] })).toEqual(DEFAULT_SMART_REMINDERS);
    expect(parseSmartReminders({ version: 2 })).toBeNull();
  });
});
