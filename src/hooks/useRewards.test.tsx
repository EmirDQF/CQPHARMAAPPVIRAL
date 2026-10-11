// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { painLogStore } from "@/lib/dashboard/painLog";
import { pillboxStore } from "@/lib/dashboard/pillbox";
import { rewardProgressStore } from "@/lib/rewards/repository";
import { EMPTY_REWARD_PROGRESS } from "@/lib/rewards/schemas";
import { toLimaIsoDate } from "@/lib/utils/date";
import { useRewards } from "./useRewards";

afterEach(() => {
  pillboxStore.write({ takenDoseIdsByDate: {} });
  painLogStore.write([]);
  rewardProgressStore.write(EMPTY_REWARD_PROGRESS);
});

describe("useRewards", () => {
  it("unlocks the first complete day and celebrates it only once", async () => {
    const { result } = renderHook(() => useRewards());
    expect(result.current.celebrations).toEqual([]);

    act(() => pillboxStore.write({ takenDoseIdsByDate: { [toLimaIsoDate()]: ["morning-collagen", "night-magnesium"] } }));
    await waitFor(() => expect(result.current.celebrations.map((item) => item.key)).toContain("primer-dia"));

    act(() => result.current.dismissCelebrations());
    expect(result.current.celebrations).toEqual([]);
    expect(rewardProgressStore.getSnapshot().unlocked.map((item) => item.key)).toContain("primer-dia");
  });

  it("an extra tap on a dose already taken does not unlock anything new", async () => {
    const today = toLimaIsoDate();
    act(() => pillboxStore.write({ takenDoseIdsByDate: { [today]: ["morning-collagen", "morning-collagen"] } }));
    const { result } = renderHook(() => useRewards());
    await waitFor(() => expect(result.current.stats.completeDays).toBe(0));
    expect(result.current.progress.unlocked).toEqual([]);
  });
});
