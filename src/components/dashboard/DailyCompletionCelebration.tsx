"use client";

import { useSyncExternalStore } from "react";
import { isDoseComplete, pillboxStore } from "@/lib/dashboard/pillbox";
import { toLimaIsoDate } from "@/lib/utils/date";

export function DailyCompletionCelebration() {
  const state = useSyncExternalStore(
    pillboxStore.subscribe,
    pillboxStore.getSnapshot,
    pillboxStore.getServerSnapshot
  );

  if (!isDoseComplete(state, toLimaIsoDate())) return null;

  return (
    <div className="rounded-xl bg-risk-low-bg text-risk-low px-4 py-3 flex items-center gap-3 font-semibold">
      <span className="text-2xl animate-bounce" aria-hidden="true">
        🎉
      </span>
      <span>¡Tomas del día completas! Mantén tu racha.</span>
    </div>
  );
}
