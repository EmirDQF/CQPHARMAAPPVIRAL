// @vitest-environment jsdom
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReminderOffer } from "@/components/dashboard/ReminderOffer";
import { usePillboxReminders } from "@/hooks/usePillboxReminders";
import { findForbiddenPhrases } from "@/lib/clinical/forbiddenCopy";
import { pillboxStore } from "@/lib/dashboard/pillbox";
import { REMINDER_TITLE, reminderPromptStore } from "./reminders";

const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36";

// 08:00 en Lima (UTC-5): media hora antes de la toma de la mañana.
const LIMA_0800 = new Date("2026-09-10T13:00:00Z");
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

class MockNotification {
  static permission: NotificationPermission = "default";
  static requestPermission = vi.fn<() => Promise<NotificationPermission>>();
  static shown: { title: string; options?: NotificationOptions }[] = [];

  constructor(title: string, options?: NotificationOptions) {
    MockNotification.shown.push({ title, options });
  }
}

function installNotifications(permission: NotificationPermission) {
  MockNotification.permission = permission;
  MockNotification.shown = [];
  MockNotification.requestPermission.mockReset();
  vi.stubGlobal("Notification", MockNotification);
}

function takeDose(date: string, doseId: string) {
  pillboxStore.write({ takenDoseIdsByDate: { [date]: [doseId] } });
}

beforeEach(() => {
  vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue(ANDROID_CHROME);
  pillboxStore.write({ takenDoseIdsByDate: {} });
  reminderPromptStore.write({ snoozedUntil: null });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("usePillboxReminders", () => {
  it("never asks for permission on its own when the app opens", () => {
    installNotifications("default");

    renderHook(() => usePillboxReminders());

    expect(MockNotification.requestPermission).not.toHaveBeenCalled();
  });

  it("offers reminders only after the first dose is registered", () => {
    installNotifications("default");
    const { result } = renderHook(() => usePillboxReminders());
    expect(result.current.shouldOffer).toBe(false);

    act(() => takeDose("2026-09-10", "morning-collagen"));

    expect(result.current.support).toBe("ask");
    expect(result.current.shouldOffer).toBe(true);
  });

  it("'Ahora no' hides the offer", () => {
    installNotifications("default");
    takeDose("2026-09-10", "morning-collagen");
    const { result } = renderHook(() => usePillboxReminders());

    act(() => result.current.snooze());

    expect(result.current.shouldOffer).toBe(false);
  });

  it("asks for permission on tap and stops offering once granted", async () => {
    installNotifications("default");
    MockNotification.requestPermission.mockImplementation(async () => {
      MockNotification.permission = "granted";
      return "granted";
    });
    takeDose("2026-09-10", "morning-collagen");
    const { result } = renderHook(() => usePillboxReminders());

    await act(() => result.current.requestPermission());

    expect(MockNotification.requestPermission).toHaveBeenCalledTimes(1);
    expect(result.current.support).toBe("granted");
    expect(result.current.shouldOffer).toBe(false);
  });

  it("falls back to the calendar when the permission is refused", async () => {
    installNotifications("default");
    MockNotification.requestPermission.mockImplementation(async () => {
      MockNotification.permission = "denied";
      return "denied";
    });
    const { result } = renderHook(() => usePillboxReminders());

    await act(() => result.current.requestPermission());

    expect(result.current.support).toBe("calendar");
  });

  it("notifies at 08:30 Lima with the neutral title only", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(LIMA_0800);
    installNotifications("granted");

    renderHook(() => usePillboxReminders());
    await act(() => vi.advanceTimersByTimeAsync(THIRTY_MINUTES_MS));

    expect(MockNotification.shown).toHaveLength(1);
    const [{ title, options }] = MockNotification.shown;
    expect(title).toBe(REMINDER_TITLE);
    expect(`${title} ${options?.body ?? ""}`).not.toMatch(
      /col[aá]geno|magnesio|vitamina|dolor|t-?score|racha/i
    );
  });

  it("skips the reminder when that dose was already taken today", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(LIMA_0800);
    installNotifications("granted");
    takeDose("2026-09-10", "morning-collagen");

    renderHook(() => usePillboxReminders());
    await act(() => vi.advanceTimersByTimeAsync(THIRTY_MINUTES_MS));

    expect(MockNotification.shown).toHaveLength(0);
  });

  it("cancels pending reminders on unmount", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(LIMA_0800);
    installNotifications("granted");

    const { unmount } = renderHook(() => usePillboxReminders());
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(THIRTY_MINUTES_MS));

    expect(MockNotification.shown).toHaveLength(0);
  });
});

describe("ReminderOffer", () => {
  it("lets the patient enable reminders or postpone them", () => {
    const onEnable = vi.fn();
    const onSnooze = vi.fn();
    render(<ReminderOffer support="ask" onEnable={onEnable} onSnooze={onSnooze} />);

    fireEvent.click(screen.getByRole("button", { name: /activar recordatorios/i }));
    fireEvent.click(screen.getByRole("button", { name: /ahora no/i }));

    expect(onEnable).toHaveBeenCalledTimes(1);
    expect(onSnooze).toHaveBeenCalledTimes(1);
  });

  it("explains to iPhone users that reminders need the installed app", () => {
    render(<ReminderOffer support="ios-install" onEnable={vi.fn()} onSnooze={vi.fn()} />);

    expect(screen.getByText(/agregar a inicio/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /activar recordatorios/i })).toBeNull();
  });

  it("downloads a calendar file when notifications are not possible", () => {
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:artikare");
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL: vi.fn() });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<ReminderOffer support="calendar" onEnable={vi.fn()} onSnooze={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /agregar a mi calendario/i }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(createObjectURL.mock.calls[0][0].type).toBe("text/calendar;charset=utf-8");
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("renders nothing once reminders are granted", () => {
    const { container } = render(
      <ReminderOffer support="granted" onEnable={vi.fn()} onSnooze={vi.fn()} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it.each(["ask", "ios-install", "calendar"] as const)(
    "uses allowed copy in the %s variant",
    (support) => {
      const { container } = render(
        <ReminderOffer support={support} onEnable={vi.fn()} onSnooze={vi.fn()} />
      );

      expect(findForbiddenPhrases(container.textContent ?? "")).toEqual([]);
    }
  );
});
