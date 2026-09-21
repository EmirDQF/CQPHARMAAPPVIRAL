"use client";

import { useSyncExternalStore } from "react";
import { calculateStreakDays, pillboxStore } from "@/lib/dashboard/pillbox";
import { buildDailyReinforcementMessage } from "@/lib/storage/reinforcementMessage";

export function DailyReinforcementBanner() {
  const state = useSyncExternalStore(
    pillboxStore.subscribe,
    pillboxStore.getSnapshot,
    pillboxStore.getServerSnapshot
  );
  const streakDays = calculateStreakDays(state);
  const message = buildDailyReinforcementMessage(streakDays);

  return (
    <p className="rounded-xl bg-brand-light/60 dark:bg-brand-dark/20 text-brand-dark dark:text-brand-light px-4 py-3 text-sm font-medium">
      💬 {message}
    </p>
  );
}
