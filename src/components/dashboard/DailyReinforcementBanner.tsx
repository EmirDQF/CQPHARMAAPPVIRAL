"use client";

import { MessageCircleHeart } from "lucide-react";
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
    <p className="flex items-start gap-2 rounded-control bg-pastel-mint text-pastel-mint-ink px-4 py-3 text-lg font-medium">
      <MessageCircleHeart aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </p>
  );
}
