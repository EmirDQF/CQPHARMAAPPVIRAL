// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pillboxStore } from "@/lib/dashboard/pillbox";
import { toLimaIsoDate } from "@/lib/utils/date";
import { useDeferredDose } from "./useDeferredDose";

const DOSE = "morning-collagen";
const LONG_WAIT_MS = 60 * 60 * 1000;
const takenOn = (date: string) => pillboxStore.getSnapshot().takenDoseIdsByDate[date] ?? [];
const takenToday = () => takenOn(toLimaIsoDate());

beforeEach(() => {
  vi.useFakeTimers();
  pillboxStore.write({ takenDoseIdsByDate: {} });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDeferredDose", () => {
  it("keeps the dose pending with no time limit until the patient confirms (WCAG 2.2.1)", () => {
    const { result } = renderHook(() => useDeferredDose());
    act(() => result.current.take(DOSE));
    act(() => vi.advanceTimersByTime(LONG_WAIT_MS));

    expect(result.current.pendingDoseIds).toEqual([DOSE]);
    expect(takenToday()).toEqual([]);

    act(() => result.current.confirm(DOSE));
    expect(takenToday()).toEqual([DOSE]);
    expect(result.current.pendingDoseIds).toEqual([]);
    expect(result.current.lastConfirmedDoseId).toBe(DOSE);
  });

  it("undo writes nothing, so sync never has to delete a dose", () => {
    const { result } = renderHook(() => useDeferredDose());
    act(() => result.current.take(DOSE));
    act(() => result.current.undo(DOSE));

    expect(takenToday()).toEqual([]);
    expect(result.current.pendingDoseIds).toEqual([]);
  });

  it("a second tap on the same slot does not count twice", () => {
    const { result } = renderHook(() => useDeferredDose());
    act(() => {
      result.current.take(DOSE);
      result.current.take(DOSE);
    });
    expect(result.current.pendingDoseIds).toEqual([DOSE]);
    act(() => result.current.confirm(DOSE));
    expect(takenToday()).toEqual([DOSE]);
  });

  it("saves the dose on the Lima day it was tapped, even if confirmed after midnight", () => {
    vi.setSystemTime(new Date("2026-10-11T23:59:50-05:00"));
    const { result } = renderHook(() => useDeferredDose());
    act(() => result.current.take("night-magnesium"));

    vi.setSystemTime(new Date("2026-10-12T00:00:30-05:00"));
    act(() => result.current.confirm("night-magnesium"));

    expect(takenOn("2026-10-11")).toEqual(["night-magnesium"]);
    expect(takenOn("2026-10-12")).toEqual([]);
  });

  it("commits pending doses when the app is hidden or the dashboard unmounts", () => {
    const { result, unmount } = renderHook(() => useDeferredDose());
    act(() => result.current.take(DOSE));
    act(() => window.dispatchEvent(new Event("pagehide")));
    expect(takenToday()).toEqual([DOSE]);

    pillboxStore.write({ takenDoseIdsByDate: {} });
    act(() => result.current.take("night-magnesium"));
    unmount();
    expect(takenToday()).toEqual(["night-magnesium"]);
  });
});
