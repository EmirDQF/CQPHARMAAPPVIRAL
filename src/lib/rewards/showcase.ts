import { goalProgress, type GoalProgress, type HabitStats } from "./rules";
import type { RewardDefinition, RewardProgress } from "./schemas";

/** Datos de la vitrina "Mis logros": lo logrado y las próximas metas más cercanas. */
export interface EarnedReward {
  reward: RewardDefinition;
  /** Veces logrado (los mensuales se repiten). */
  times: number;
  firstUnlockedOn: string;
}

export interface UpcomingGoal {
  reward: RewardDefinition;
  progress: GoalProgress | null;
}

export const UPCOMING_GOALS_SHOWN = 3;

export function buildShowcase(
  catalog: readonly RewardDefinition[],
  stats: HabitStats,
  progress: RewardProgress
): { earned: EarnedReward[]; upcoming: UpcomingGoal[] } {
  const earned = catalog.flatMap((reward): EarnedReward[] => {
    const unlocks = progress.unlocked.filter((item) => item.rewardId === reward.id);
    return unlocks.length > 0 ? [{ reward, times: unlocks.length, firstUnlockedOn: unlocks[0].unlockedOn }] : [];
  });
  const earnedIds = new Set(earned.map((item) => item.reward.id));
  const ratio = (goal: UpcomingGoal) => (goal.progress ? goal.progress.current / goal.progress.target : 0);
  const upcoming = catalog
    .filter((reward) => !earnedIds.has(reward.id))
    .map((reward) => ({ reward, progress: goalProgress(reward.rule, stats) }))
    .sort((a, b) => ratio(b) - ratio(a))
    .slice(0, UPCOMING_GOALS_SHOWN);
  return { earned, upcoming };
}
