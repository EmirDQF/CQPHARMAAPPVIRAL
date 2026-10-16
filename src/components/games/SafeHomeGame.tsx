"use client";

import { useState } from "react";
import { GameButton } from "@/components/ui/GameButton";
import { triggerHaptic } from "@/lib/feedback/haptics";
import { playSound } from "@/lib/feedback/sounds";
import type { GameScore } from "@/lib/gamification/miniGames";
import type { HomeSpot } from "@/lib/gamification/rheumaEducationSchemas";
import { GameFrame } from "./GameFrame";
import { HomeIllustration } from "./HomeIllustration";

interface SafeHomeGameProps {
  spots: readonly HomeSpot[];
  onExit: () => void;
  onRoundEnd: (score: GameScore) => void;
}

/** Toca los riesgos de caída de la casa. Los aciertos "seguros" también enseñan. */
export function SafeHomeGame({ spots, onExit, onRoundEnd }: SafeHomeGameProps) {
  const [seen, setSeen] = useState<readonly string[]>([]);
  const risks = spots.filter((spot) => spot.isRisk);
  const found = risks.filter((spot) => seen.includes(spot.id)).length;
  const last = spots.find((spot) => spot.id === seen[seen.length - 1]);

  function inspect(spot: HomeSpot) {
    if (seen.includes(spot.id)) return;
    setSeen([...seen, spot.id]);
    playSound(spot.isRisk ? "correct" : "tap");
    void triggerHaptic(spot.isRisk ? "success" : "light");
  }

  return (
    <GameFrame title="Casa segura" step={found} total={risks.length} emotion={last?.isRisk === false ? "happy" : "thinking"} onExit={onExit}>
      <p className="text-lg">Toca los círculos y encuentra los {risks.length} riesgos de caída.</p>
      <div className="relative overflow-hidden rounded-card border-2 border-line">
        <HomeIllustration />
        {spots.map((spot) => {
          const isSeen = seen.includes(spot.id);
          return (
            <button
              key={spot.id}
              type="button"
              onClick={() => inspect(spot)}
              aria-label={isSeen ? `${spot.label}: ${spot.isRisk ? "riesgo encontrado" : "esto está bien"}` : spot.label}
              aria-pressed={isSeen}
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              className={`absolute flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 text-xl font-black shadow-soft ${
                isSeen ? (spot.isRisk ? "border-vital-deep bg-vital text-vital-ink" : "border-sky-deep bg-sky text-sky-ink") : "border-gold-deep bg-surface/90 text-clinic motion-safe:animate-pulse"
              }`}
            >
              <span aria-hidden="true">{isSeen ? (spot.isRisk ? "⚠️" : "👍") : "?"}</span>
            </button>
          );
        })}
      </div>
      {last && (
        <div role="status" className="rounded-control bg-pastel-sky px-4 py-3 text-pastel-sky-ink">
          <p className="text-xl font-black">{last.isRisk ? `Riesgo: ${last.label}` : last.label}</p>
          <p className="text-lg">{last.explanation}</p>
        </div>
      )}
      <GameButton tone={found === risks.length ? "vital" : "surface"} block onClick={() => onRoundEnd({ correct: found, total: risks.length })}>
        {found === risks.length ? "Ver resultado" : "Terminar por ahora"}
      </GameButton>
    </GameFrame>
  );
}
