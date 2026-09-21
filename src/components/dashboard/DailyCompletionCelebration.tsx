"use client";

import { useSyncExternalStore } from "react";
import { todayIsoDate } from "@/lib/dashboard/painLog";
import { isDoseComplete, pillboxStore } from "@/lib/dashboard/pillbox";

export function DailyCompletionCelebration() {
  const state = useSyncExternalStore(
    pillboxStore.subscribe,
    pillboxStore.getSnapshot,
    pillboxStore.getServerSnapshot
  );

  if (!isDoseComplete(state, todayIsoDate())) return null;

  return (
    <div className="rounded-xl bg-risk-low-bg text-risk-low px-4 py-3 flex items-center gap-3 font-semibold">
      <span className="text-2xl animate-bounce" aria-hidden="true">
        🎉
      </span>
      <span>¡Huesos protegidos hoy! Mantén tu racha.</span>
    </div>
  );
}
