import { describe, expect, it } from "vitest";
import { computeHabitStats } from "./rules";
import { EMPTY_REWARD_PROGRESS, type RewardDefinition } from "./schemas";
import { buildShowcase } from "./showcase";

const reward = (id: string, rule: RewardDefinition["rule"]): RewardDefinition => ({
  id, title: id, description: "d", rule, illustration: "star", tone: "mint",
});

describe("buildShowcase", () => {
  const catalog = [
    reward("mes", { type: "monthlyCheckIn" }),
    reward("racha-7", { type: "streak", days: 7 }),
    reward("racha-3", { type: "streak", days: 3 }),
    reward("vuelta", { type: "returnAfterBreak", gapDays: 2 }),
    reward("dias-30", { type: "completeDays", total: 30 }),
  ];
  const stats = computeHabitStats(
    { takenDoseIdsByDate: { "2026-10-01": ["morning-collagen", "night-magnesium"], "2026-10-02": ["morning-collagen", "night-magnesium"] } },
    [],
    new Date("2026-10-02T12:00:00-05:00")
  );

  it("lists the closest upcoming goals first and counts repeated monthly unlocks", () => {
    const progress = {
      ...EMPTY_REWARD_PROGRESS,
      unlocked: [
        { rewardId: "mes", key: "mes:2026-09", unlockedOn: "2026-09-03" },
        { rewardId: "mes", key: "mes:2026-10", unlockedOn: "2026-10-01" },
      ],
    };
    const { earned, upcoming } = buildShowcase(catalog, stats, progress);
    expect(earned).toEqual([{ reward: catalog[0], times: 2, firstUnlockedOn: "2026-09-03" }]);
    expect(upcoming.map((goal) => goal.reward.id)).toEqual(["racha-3", "racha-7", "dias-30"]);
  });
});
