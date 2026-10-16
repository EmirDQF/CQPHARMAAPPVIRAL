import { ACTIVITY_CATALOG } from "../activities/catalog";
import { painLogStore } from "../dashboard/painLog";
import { pillboxStore } from "../dashboard/pillbox";
import { DAILY_GOAL_BY_INTENSITY, onboardingStore } from "../onboarding/onboarding";
import { computeGameStats, evaluateUnlocks, type GameSources } from "./engine";
import { gameProgressStore, type GameProgress } from "./progress";
import { GAME_UNLOCKS, type GameUnlock } from "./unlocks";

export interface LearningUnlockResult {
  progress: GameProgress;
  unlocked: GameUnlock[];
}

/**
 * Tras una lección o un juego, evalúa insignias y accesorios y los marca como
 * celebrados: se muestran en el mismo modal de recompensa, no otra vez en "Hoy".
 */
export function unlocksAfterLearning(sources: GameSources, today: string, dailyGoal: number): LearningUnlockResult {
  const stats = computeGameStats(ACTIVITY_CATALOG, sources, today, dailyGoal);
  const { progress, newlyUnlocked } = evaluateUnlocks(GAME_UNLOCKS, stats, sources.progress, today);
  if (newlyUnlocked.length === 0) return { progress, unlocked: [] };
  const keys = newlyUnlocked.map((item) => item.key);
  const unlocked = newlyUnlocked.flatMap((item) => GAME_UNLOCKS.filter((unlock) => unlock.id === item.unlockId));
  return { progress: { ...progress, celebratedKeys: [...new Set([...progress.celebratedKeys, ...keys])] }, unlocked };
}

export function recordLearningUnlocks(today: string): GameUnlock[] {
  if (gameProgressStore.hasUnreadableData()) return [];
  const sources: GameSources = {
    pillbox: pillboxStore.getSnapshot(),
    painEntries: painLogStore.getSnapshot(),
    progress: gameProgressStore.getSnapshot(),
  };
  const dailyGoal = DAILY_GOAL_BY_INTENSITY[onboardingStore.getSnapshot().intensity];
  const { progress, unlocked } = unlocksAfterLearning(sources, today, dailyGoal);
  if (progress !== sources.progress) gameProgressStore.write(progress);
  return unlocked;
}
