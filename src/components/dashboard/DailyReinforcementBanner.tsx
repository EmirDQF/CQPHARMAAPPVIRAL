"use client";

import { MessageCircleHeart } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { GameButton } from "@/components/ui/GameButton";
import { calculateStreakDays, pillboxStore } from "@/lib/dashboard/pillbox";
import { buildDailyReinforcementMessage } from "@/lib/storage/reinforcementMessage";
import { useActiveRedFlags } from "./useActiveRedFlags";

/** Lema de racha + frase del día; "Otra frase" muestra la siguiente sin repetir. */
export function DailyReinforcementBanner() {
  const state = useSyncExternalStore(
    pillboxStore.subscribe,
    pillboxStore.getSnapshot,
    pillboxStore.getServerSnapshot
  );
  const hasRedFlag = useActiveRedFlags().length > 0;
  const [offset, setOffset] = useState(0);
  const streakDays = calculateStreakDays(state);
  const message = buildDailyReinforcementMessage(streakDays, new Date(), { offset, hasRedFlag });

  return (
    <div className="flex flex-col gap-2 rounded-control bg-pastel-mint text-pastel-mint-ink px-4 py-3">
      <p className="flex items-start gap-2 text-lg font-medium" aria-live="polite">
        <MessageCircleHeart aria-hidden="true" className="mt-1 size-5 shrink-0" />
        <span key={offset} className="animate-fade-in">
          {message}
        </span>
      </p>
      <GameButton
        tone="surface"
        size="md"
        className="self-end"
        onClick={() => setOffset((current) => current + 1)}
      >
        <span aria-hidden="true">✨</span> Otra frase
      </GameButton>
    </div>
  );
}
