// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toLimaIsoDate } from "@/lib/utils/date";

const FUTURE_PROGRESS = JSON.stringify({ version: 99, unlocked: [{ id: "algo-nuevo" }] });

afterEach(() => {
  window.localStorage.clear();
  vi.resetModules();
});

describe("useRewards con progreso ilegible", () => {
  it("never overwrites saved rewards it cannot read (no progress is ever taken away)", async () => {
    window.localStorage.setItem("artikare_rewards_v1", FUTURE_PROGRESS);
    window.localStorage.setItem(
      "artikare_pillbox_v1",
      JSON.stringify({ takenDoseIdsByDate: { [toLimaIsoDate()]: ["morning-collagen", "night-magnesium"] } })
    );
    vi.resetModules();
    const { useRewards } = await import("./useRewards");

    const { result } = renderHook(() => useRewards());
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.stats.completeDays).toBe(1);
    expect(window.localStorage.getItem("artikare_rewards_v1")).toBe(FUTURE_PROGRESS);
  });
});
