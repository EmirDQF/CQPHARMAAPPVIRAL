import { describe, expect, it } from "vitest";
import { BOTTLE_SERVINGS, RESTOCK_TRIGGER_DAY } from "../clinical/constants";
import { addDaysToIsoDate } from "../utils/date";
import { buildBottleStatuses } from "./bottleTracking";
import type { PillboxState } from "./types";

function stateWithMorningDoses(count: number): PillboxState {
  const takenDoseIdsByDate: Record<string, string[]> = {};
  for (let day = 0; day < count; day += 1) {
    takenDoseIdsByDate[addDaysToIsoDate("2026-01-01", day)] = ["morning-collagen"];
  }
  return { takenDoseIdsByDate };
}

describe("buildBottleStatuses", () => {
  it("starts with a full bottle for each dose period", () => {
    const statuses = buildBottleStatuses({ takenDoseIdsByDate: {} });

    expect(statuses.map((status) => status.servingsRemaining)).toEqual([
      BOTTLE_SERVINGS,
      BOTTLE_SERVINGS,
    ]);
    expect(statuses.every((status) => !status.needsRestock)).toBe(true);
  });

  it("triggers restock exactly on the restock day (10 servings left)", () => {
    const beforeTrigger = buildBottleStatuses(stateWithMorningDoses(RESTOCK_TRIGGER_DAY - 1));
    const onTrigger = buildBottleStatuses(stateWithMorningDoses(RESTOCK_TRIGGER_DAY));

    expect(beforeTrigger[0].needsRestock).toBe(false);
    expect(onTrigger[0].needsRestock).toBe(true);
    expect(onTrigger[0].servingsRemaining).toBe(10);
    expect(onTrigger[1].needsRestock).toBe(false);
  });

  it("never reports negative servings", () => {
    const statuses = buildBottleStatuses(stateWithMorningDoses(BOTTLE_SERVINGS + 5));
    expect(statuses[0].servingsRemaining).toBe(0);
    expect(statuses[0].percentRemaining).toBe(0);
  });
});
