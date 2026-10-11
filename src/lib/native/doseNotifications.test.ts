import { beforeEach, describe, expect, it, vi } from "vitest";
import { DOSE_SCHEDULE } from "../clinical/constants";
import { REMINDER_BODY, REMINDER_TITLE } from "../reminders/reminders";
import {
  buildNativeDoseNotifications,
  enableNativeDoseReminders,
  syncNativeDoseReminders,
} from "./doseNotifications";

const plugin = vi.hoisted(() => ({
  checkPermissions: vi.fn(async () => ({ display: "granted" })),
  requestPermissions: vi.fn(async () => ({ display: "granted" })),
  cancel: vi.fn(async () => undefined),
  schedule: vi.fn(async () => ({ notifications: [] })),
}));
vi.mock("@capacitor/local-notifications", () => ({ LocalNotifications: plugin }));

beforeEach(() => {
  vi.clearAllMocks();
  plugin.checkPermissions.mockResolvedValue({ display: "granted" });
  plugin.requestPermissions.mockResolvedValue({ display: "granted" });
});

describe("buildNativeDoseNotifications", () => {
  it("schedules every dose daily at its Lima time even when the phone is in another time zone", () => {
    // 2026-10-10 12:00 en Lima (UTC-5) = 17:00 UTC.
    const notifications = buildNativeDoseNotifications(new Date("2026-10-10T17:00:00.000Z"));

    expect(notifications).toHaveLength(DOSE_SCHEDULE.length);
    const [morning, night] = notifications;
    // 08:30 ya pasó: mañana 08:30 Lima = 13:30 UTC. 21:30 Lima de hoy = 02:30 UTC del día siguiente.
    expect(morning.schedule.at.toISOString()).toBe("2026-10-11T13:30:00.000Z");
    expect(night.schedule.at.toISOString()).toBe("2026-10-11T02:30:00.000Z");
    notifications.forEach((notification) => {
      expect(notification.schedule.every).toBe("day");
      expect(notification.title).toBe(REMINDER_TITLE);
      expect(notification.body).toBe(REMINDER_BODY);
    });
  });

  it("uses stable distinct ids so rescheduling replaces instead of duplicating", () => {
    const ids = buildNativeDoseNotifications(new Date()).map((notification) => notification.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(buildNativeDoseNotifications(new Date(0)).map((notification) => notification.id)).toEqual(ids);
  });

  it("never includes health data in the notification text", () => {
    const text = buildNativeDoseNotifications(new Date())
      .map((notification) => `${notification.title} ${notification.body}`)
      .join(" ");
    DOSE_SCHEDULE.forEach((dose) => expect(text).not.toContain(dose.label));
  });
});

describe("syncNativeDoseReminders", () => {
  it("reads the OS permission without prompting and reschedules the same ids when granted", async () => {
    const now = new Date("2026-10-10T17:00:00.000Z");

    await expect(syncNativeDoseReminders(now)).resolves.toBe("granted");
    await expect(syncNativeDoseReminders(now)).resolves.toBe("granted");

    expect(plugin.requestPermissions).not.toHaveBeenCalled();
    expect(plugin.schedule).toHaveBeenCalledTimes(2);
    const scheduledIds = plugin.schedule.mock.calls.map(
      ([options]) => (options as { notifications: { id: number }[] }).notifications.map(({ id }) => id)
    );
    expect(scheduledIds[0]).toEqual(scheduledIds[1]);
    expect(plugin.cancel).toHaveBeenCalledTimes(2);
  });

  it.each(["prompt", "prompt-with-rationale"])("reports %s as not yet decided and schedules nothing", async (display) => {
    plugin.checkPermissions.mockResolvedValueOnce({ display });

    await expect(syncNativeDoseReminders()).resolves.toBe("prompt");
    expect(plugin.schedule).not.toHaveBeenCalled();
  });

  it("reports a denied permission and schedules nothing", async () => {
    plugin.checkPermissions.mockResolvedValueOnce({ display: "denied" });

    await expect(syncNativeDoseReminders()).resolves.toBe("denied");
    expect(plugin.schedule).not.toHaveBeenCalled();
  });

  it("falls back to 'prompt' when the plugin fails, so the offer can still appear", async () => {
    plugin.checkPermissions.mockRejectedValueOnce(new Error("plugin"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(syncNativeDoseReminders()).resolves.toBe("prompt");
  });
});

describe("enableNativeDoseReminders", () => {
  it("replaces previous reminders and schedules the daily doses once permission is granted", async () => {
    await expect(enableNativeDoseReminders(new Date("2026-10-10T17:00:00.000Z"))).resolves.toBe("granted");

    expect(plugin.cancel).toHaveBeenCalledTimes(1);
    expect(plugin.schedule).toHaveBeenCalledWith({
      notifications: buildNativeDoseNotifications(new Date("2026-10-10T17:00:00.000Z")),
    });
  });

  it("schedules locally without touching the network, so reminders keep working offline", async () => {
    const fetchSpy = vi.fn(() => Promise.reject(new Error("sin red")));
    vi.stubGlobal("fetch", fetchSpy);

    await expect(enableNativeDoseReminders(new Date("2026-10-10T17:00:00.000Z"))).resolves.toBe("granted");

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(plugin.schedule).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it("schedules nothing when the patient denies permission", async () => {
    plugin.requestPermissions.mockResolvedValue({ display: "denied" });

    await expect(enableNativeDoseReminders()).resolves.toBe("denied");
    expect(plugin.schedule).not.toHaveBeenCalled();
  });

  it("reports failure instead of throwing when the plugin errors", async () => {
    plugin.schedule.mockRejectedValueOnce(new Error("plugin"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(enableNativeDoseReminders()).resolves.toBe("denied");
  });
});
