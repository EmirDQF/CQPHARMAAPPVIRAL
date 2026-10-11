// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UNDO_WINDOW_MS } from "@/lib/clinical/constants";
import { pillboxStore } from "@/lib/dashboard/pillbox";
import { toLimaIsoDate } from "@/lib/utils/date";
import { useDeferredDose } from "./useDeferredDose";

const DOSE = "morning-collagen";
const takenToday = () => pillboxStore.getSnapshot().takenDoseIdsByDate[toLimaIsoDate()] ?? [];

beforeEach(() => {
  vi.useFakeTimers();
  pillboxStore.write({ takenDoseIdsByDate: {} });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDeferredDose", () => {
  it("shows the dose as pending and writes it only when the undo window ends", () => {
    const { result } = renderHook(() => useDeferredDose());
    act(() => result.current.take(DOSE));

    expect(result.current.pendingDoseIds).toEqual([DOSE]);
    expect(takenToday()).toEqual([]);

    act(() => vi.advanceTimersByTime(UNDO_WINDOW_MS));
    expect(takenToday()).toEqual([DOSE]);
    expect(result.current.pendingDoseIds).toEqual([]);
  });

  it("undo within the window writes nothing, so sync never has to delete a dose", () => {
    const { result } = renderHook(() => useDeferredDose());
    act(() => result.current.take(DOSE));
    act(() => result.current.undo(DOSE));
    act(() => vi.advanceTimersByTime(UNDO_WINDOW_MS));

    expect(takenToday()).toEqual([]);
    expect(result.current.pendingDoseIds).toEqual([]);
  });

  it("a second tap on the same slot does not count twice", () => {
    const { result } = renderHook(() => useDeferredDose());
    act(() => {
      result.current.take(DOSE);
      result.current.take(DOSE);
    });
    act(() => vi.advanceTimersByTime(UNDO_WINDOW_MS));
    expect(takenToday()).toEqual([DOSE]);
  });

  it("commits pending doses when the app is hidden or the screen unmounts", () => {
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
