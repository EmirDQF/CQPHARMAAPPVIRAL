"use client";

import { useState } from "react";
import { GameButton } from "@/components/ui/GameButton";
import type { GameState } from "@/hooks/useGame";
import { completeActivity } from "@/lib/gamification/progress";
import type { ShareMoment } from "@/lib/share/momentShare";
import { ShareMomentSheet } from "./ShareMomentSheet";

const INVITE_ACTIVITY_ID = "anima-familia";
const WEEK_DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"] as const;

function WeeklyChallenge({ activeDays, target, done, activeByWeekday }: GameState["stats"]["week"]) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-pastel-peach px-4 py-4 text-pastel-peach-ink">
      <h3 className="text-xl font-black">
        Reto “Semana constante” <span aria-hidden="true">🔥</span>
      </h3>
      <p className="text-lg">{done ? "¡Lo lograste! 7 de 7 días activos esta semana." : `${activeDays} de ${target} días activos esta semana (lunes a domingo).`}</p>
      <ol aria-hidden="true" className="flex gap-1.5">
        {WEEK_DAY_LABELS.map((label, index) => (
          <li
            key={`${label}-${index}`}
            className={`flex size-9 items-center justify-center rounded-full text-base font-black ${activeByWeekday[index] ? "bg-streak text-streak-ink" : "bg-surface text-muted"}`}
          >
            {activeByWeekday[index] ? "🔥" : label}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Compartir es opcional: botones claros, vista previa y "Ahora no". Invitar solo da recompensas cosméticas. */
export function ShareCorner({ game }: { game: GameState }) {
  const [moment, setMoment] = useState<ShareMoment | null>(null);
  const { week, streak } = game.stats;

  return (
    <section aria-labelledby="comparte-artiko" className="flex flex-col gap-3">
      <h2 id="comparte-artiko" className="text-2xl font-black text-clinic">
        Comparte con Artiko <span aria-hidden="true">💌</span>
      </h2>
      <WeeklyChallenge {...week} />
      {week.done && (
        <GameButton tone="streak" size="md" onClick={() => setMoment({ kind: "badge", unlockId: "semana-constante" })}>
          Compartir mi insignia 🔥
        </GameButton>
      )}
      {streak.days > 0 && (
        <GameButton tone="gold" size="md" onClick={() => setMoment({ kind: "streak", days: streak.days })}>
          Compartir mi racha de {streak.days} {streak.days === 1 ? "día" : "días"} 🔥
        </GameButton>
      )}
      <GameButton tone="pink" size="md" onClick={() => setMoment({ kind: "invite-parent" })}>
        Invita a tu mamá o papá a hacer el test 💌
      </GameButton>
      {moment && (
        <ShareMomentSheet
          moment={moment}
          onShared={moment.kind === "invite-parent" ? () => completeActivity(INVITE_ACTIVITY_ID, game.today) : undefined}
          onClose={() => setMoment(null)}
        />
      )}
    </section>
  );
}
