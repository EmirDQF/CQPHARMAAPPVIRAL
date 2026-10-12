"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useClinicalStatus } from "@/components/dashboard/useActiveRedFlags";
import { ACTIVITY_CATALOG } from "@/lib/activities/catalog";
import { selectDailyMissions } from "@/lib/activities/rotation";
import type { Activity } from "@/lib/activities/schemas";
import { painLogStore } from "@/lib/dashboard/painLog";
import { pillboxStore } from "@/lib/dashboard/pillbox";
import {
  completedOn,
  computeGameStats,
  dailyGoalStatus,
  evaluateUnlocks,
  unlockedAccessories,
  type GameStats,
  type GoalStatus,
} from "@/lib/gamification/engine";
import { pickArtikoMood, type ArtikoMood } from "@/lib/gamification/mood";
import { gameProgressStore, markOpened, previousOpeningBefore, type GameProgress } from "@/lib/gamification/progress";
import { GAME_UNLOCKS, type GameUnlock } from "@/lib/gamification/unlocks";
import type { ArtikoAccessory } from "@/lib/mascot/mascot";
import { DAILY_GOAL_BY_INTENSITY, onboardingStore } from "@/lib/onboarding/onboarding";
import { toLimaIsoDate } from "@/lib/utils/date";

export interface GameState {
  today: string;
  missions: readonly Activity[];
  completed: ReadonlySet<string>;
  goal: GoalStatus;
  stats: GameStats;
  mood: ArtikoMood;
  hasRedFlag: boolean;
  progress: GameProgress;
  accessories: readonly ArtikoAccessory[];
  /** Desbloqueos aún no celebrados en pantalla. */
  pendingUnlocks: readonly { key: string; unlock: GameUnlock }[];
}

function usePersistent<T>(store: { subscribe: (listener: () => void) => () => void; getSnapshot: () => T; getServerSnapshot: () => T }): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

/**
 * Estado del juego para "Hoy": misiones del día de Lima, lo completado
 * (tomas anotadas con deshacer incluidas), meta, XP, racha con gracia, ánimo
 * de Artiko y desbloqueos. Evalúa y guarda los desbloqueos nuevos (idempotente).
 */
export function useGame(now: Date, pendingDoseIds: readonly string[] = []): GameState {
  const pillbox = usePersistent(pillboxStore);
  const painEntries = usePersistent(painLogStore);
  const progress = usePersistent(gameProgressStore);
  const { intensity } = usePersistent(onboardingStore);
  const { redFlags } = useClinicalStatus();
  const today = toLimaIsoDate(now);
  const hasRedFlag = redFlags.length > 0;
  const dailyGoal = DAILY_GOAL_BY_INTENSITY[intensity];
  const lastOpenedOn = previousOpeningBefore(progress, today);
  useEffect(() => markOpened(today), [today]);

  const missions = selectDailyMissions({ catalog: ACTIVITY_CATALOG, date: today, goal: dailyGoal, hasRedFlag });
  const sources = { pillbox, painEntries, progress };
  const pendingDoseActivityIds = ACTIVITY_CATALOG.filter((activity) => activity.doseId && pendingDoseIds.includes(activity.doseId)).map(
    (activity) => activity.id
  );
  const completed = new Set([...completedOn(ACTIVITY_CATALOG, sources, today), ...pendingDoseActivityIds]);
  const stats = computeGameStats(ACTIVITY_CATALOG, sources, today, dailyGoal);
  const goal = dailyGoalStatus(missions, completed, Math.min(dailyGoal, missions.length));

  // Idempotente: sin novedades no escribe, así que correr en cada render no crea bucles. Lee el
  // snapshot fresco: otro efecto del mismo commit (p. ej. la celebración) pudo escribir antes.
  useEffect(() => {
    if (gameProgressStore.hasUnreadableData()) return;
    const current = gameProgressStore.getSnapshot();
    const { progress: next } = evaluateUnlocks(GAME_UNLOCKS, stats, current, today);
    if (next !== current) gameProgressStore.write(next);
  });

  const nextMission = missions.find((mission) => !completed.has(mission.id)) ?? null;
  const mood = pickArtikoMood({ now, today, hasRedFlag, goalMet: goal.met, streakDays: stats.streak.days, lastOpenedOn, nextMission });
  const pendingUnlocks = progress.unlocked
    .filter((item) => !progress.celebratedKeys.includes(item.key))
    .flatMap((item) => {
      const unlock = GAME_UNLOCKS.find((candidate) => candidate.id === item.unlockId);
      return unlock ? [{ key: item.key, unlock }] : [];
    });

  return {
    today,
    missions,
    completed,
    goal,
    stats,
    mood,
    hasRedFlag,
    progress,
    accessories: unlockedAccessories(GAME_UNLOCKS, progress),
    pendingUnlocks,
  };
}
