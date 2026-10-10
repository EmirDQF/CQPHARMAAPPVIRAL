// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  buildRemindersIcs,
  detectReminderSupport,
  reminderPromptStore,
  shouldNotifyDose,
  shouldOfferReminders,
  snoozeReminderOffer,
} from "./reminders";

afterEach(() => {
  reminderPromptStore.write({ snoozedUntil: null });
});

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36";

describe("detectReminderSupport", () => {
  it("asks for permission when notifications are available and undecided", () => {
    expect(
      detectReminderSupport({ userAgent: ANDROID_CHROME, permission: "default", isStandalone: false })
    ).toBe("ask");
  });

  it("sends iOS Safari in the browser to 'add to home screen' first", () => {
    expect(
      detectReminderSupport({ userAgent: IPHONE_SAFARI, permission: "unsupported", isStandalone: false })
    ).toBe("ios-install");
  });

  it("lets an installed iOS app ask for permission", () => {
    expect(
      detectReminderSupport({ userAgent: IPHONE_SAFARI, permission: "default", isStandalone: true })
    ).toBe("ask");
  });

  it("falls back to the calendar when blocked or unsupported", () => {
    expect(
      detectReminderSupport({ userAgent: ANDROID_CHROME, permission: "denied", isStandalone: false })
    ).toBe("calendar");
    expect(
      detectReminderSupport({ userAgent: ANDROID_CHROME, permission: "unsupported", isStandalone: false })
    ).toBe("calendar");
  });

  it("does nothing more once granted", () => {
    expect(
      detectReminderSupport({ userAgent: ANDROID_CHROME, permission: "granted", isStandalone: true })
    ).toBe("granted");
  });
});

describe("shouldOfferReminders", () => {
  it("waits until the first dose has been taken", () => {
    expect(shouldOfferReminders({ snoozedUntil: null }, "2026-09-10", false)).toBe(false);
    expect(shouldOfferReminders({ snoozedUntil: null }, "2026-09-10", true)).toBe(true);
  });

  it("'Ahora no' hides the offer for 14 days", () => {
    snoozeReminderOffer("2026-09-10");
    const state = reminderPromptStore.getSnapshot();

    expect(state.snoozedUntil).toBe("2026-09-24");
    expect(shouldOfferReminders(state, "2026-09-23", true)).toBe(false);
    expect(shouldOfferReminders(state, "2026-09-24", true)).toBe(true);
  });
});

describe("shouldNotifyDose", () => {
  it("never reminds a dose already taken today", () => {
    const state = { takenDoseIdsByDate: { "2026-09-10": ["morning-collagen"] } };
    expect(shouldNotifyDose(state, "morning-collagen", "2026-09-10")).toBe(false);
    expect(shouldNotifyDose(state, "night-magnesium", "2026-09-10")).toBe(true);
  });
});

describe("buildRemindersIcs", () => {
  const ics = buildRemindersIcs();

  it("creates two daily events at 08:30 and 21:30 Lima time", () => {
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain("RRULE:FREQ=DAILY");
    expect(ics).toContain("DTSTART;TZID=America/Lima:");
    expect(ics).toMatch(/T083000/);
    expect(ics).toMatch(/T213000/);
    expect(ics).toContain("END:VCALENDAR");
  });

  it("carries only the neutral title, without health data or product names", () => {
    expect(ics).toContain("SUMMARY:Toma tus suplementos");
    expect(ics).not.toMatch(/col[aá]geno|magnesio|vitamina|dolor|t-?score|racha/i);
  });

  it("uses CRLF line endings as RFC 5545 requires", () => {
    expect(ics).toContain("\r\n");
    expect(ics.replace(/\r\n/g, "")).not.toContain("\n");
  });
});
