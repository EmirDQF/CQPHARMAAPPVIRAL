"use client";

import { useSyncExternalStore } from "react";
import { GameButton } from "@/components/ui/GameButton";
import { useMinuteClock } from "@/hooks/useMinuteClock";
import { playSound } from "@/lib/feedback/sounds";
import { gameProgressStore } from "@/lib/gamification/progress";
import { dailyChestContent, isChestOpened, openDailyChest } from "@/lib/rewards/dailyChest";
import { toLimaIsoDate } from "@/lib/utils/date";

/** Cofre del día: un dato educativo y una frase. Sin XP, sin compras, sin urgencia. */
export function DailyChest({ hasRedFlag }: { hasRedFlag: boolean }) {
  const now = useMinuteClock();
  const progress = useSyncExternalStore(gameProgressStore.subscribe, gameProgressStore.getSnapshot, gameProgressStore.getServerSnapshot);
  if (!now) return null;
  const today = toLimaIsoDate(now);
  const isOpen = isChestOpened(progress, today);
  const content = dailyChestContent(now, hasRedFlag);

  return (
    <section aria-labelledby="cofre-del-dia" className="flex flex-col gap-3 rounded-card border-2 border-gold-deep bg-gold p-4 text-gold-ink">
      <h2 id="cofre-del-dia" className="flex items-center gap-2 text-2xl font-black">
        <span aria-hidden="true">{isOpen ? "📖" : "🎁"}</span> Cofre del día
      </h2>
      {isOpen ? (
        <div className="animate-fade-in flex flex-col gap-2" aria-live="polite">
          <p className="text-lg font-bold">{content.factTitle}</p>
          <p className="text-lg">{content.fact}</p>
          <p className="text-lg">Referencia general: {content.source}. Consulta a tu médico.</p>
          <p className="rounded-control bg-surface px-3 py-2 text-lg text-foreground">{content.phrase}</p>
        </div>
      ) : (
        <>
          <p className="text-lg">Ábrelo para descubrir un dato y una frase para hoy.</p>
          <GameButton
            tone="surface"
            block
            onClick={() => {
              openDailyChest(today);
              playSound("chest");
            }}
          >
            Abrir el cofre
          </GameButton>
        </>
      )}
    </section>
  );
}
