"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { painLogStore } from "@/lib/dashboard/painLog";
import { pillboxStore } from "@/lib/dashboard/pillbox";
import { REWARD_CATALOG } from "@/lib/rewards/catalog";
import { createLocalRewardCatalogRepository, rewardProgressStore, type RewardCatalogRepository } from "@/lib/rewards/repository";
import { computeHabitStats, evaluateRewards, markCelebrated, pendingCelebrations, type HabitStats } from "@/lib/rewards/rules";
import type { RewardDefinition, RewardProgress } from "@/lib/rewards/schemas";
import { toLimaIsoDate } from "@/lib/utils/date";

const localRepository = createLocalRewardCatalogRepository();

export interface CelebratedReward {
  key: string;
  reward: RewardDefinition;
}

export interface RewardsState {
  catalog: readonly RewardDefinition[];
  stats: HabitStats;
  progress: RewardProgress;
  celebrations: CelebratedReward[];
  dismissCelebrations: () => void;
}

function useRewardCatalog(repository: RewardCatalogRepository): readonly RewardDefinition[] {
  const [catalog, setCatalog] = useState<readonly RewardDefinition[]>(REWARD_CATALOG);
  useEffect(() => {
    let isActive = true;
    repository
      .load()
      .then((loaded) => {
        if (isActive) setCatalog(loaded);
      })
      .catch((error: unknown) => console.error("[rewards] No se pudo cargar el catálogo; se usa el local", error));
    return () => {
      isActive = false;
    };
  }, [repository]);
  return catalog;
}

/** Logros por constancia: evalúa al cambiar tomas o chequeos y guarda solo lo nuevo (idempotente). */
export function useRewards(repository: RewardCatalogRepository = localRepository): RewardsState {
  const catalog = useRewardCatalog(repository);
  const pillbox = useSyncExternalStore(pillboxStore.subscribe, pillboxStore.getSnapshot, pillboxStore.getServerSnapshot);
  const painEntries = useSyncExternalStore(painLogStore.subscribe, painLogStore.getSnapshot, painLogStore.getServerSnapshot);
  const progress = useSyncExternalStore(
    rewardProgressStore.subscribe,
    rewardProgressStore.getSnapshot,
    rewardProgressStore.getServerSnapshot
  );
  const stats = useMemo(() => computeHabitStats(pillbox, painEntries), [pillbox, painEntries]);

  useEffect(() => {
    const { progress: next } = evaluateRewards(catalog, stats, progress, toLimaIsoDate());
    if (next !== progress) rewardProgressStore.write(next);
  }, [catalog, stats, progress]);

  const celebrations = pendingCelebrations(progress).flatMap((item): CelebratedReward[] => {
    const reward = catalog.find((candidate) => candidate.id === item.rewardId);
    return reward ? [{ key: item.key, reward }] : [];
  });

  const dismissCelebrations = () =>
    rewardProgressStore.write(markCelebrated(rewardProgressStore.getSnapshot(), celebrations.map((item) => item.key)));

  return { catalog, stats, progress, celebrations, dismissCelebrations };
}
