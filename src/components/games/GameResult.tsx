"use client";

import { ArtikoMascot } from "@/components/mascot/ArtikoMascot";
import { GameButton } from "@/components/ui/GameButton";
import type { GameScore } from "@/lib/gamification/miniGames";

interface GameResultProps {
  score: GameScore;
  best: GameScore | undefined;
  onReplay: () => void;
  onFinish: () => void;
}

function headline({ correct, total }: GameScore): string {
  if (correct === total) return "¡Perfecto! 🌟";
  if (correct / total >= 0.5) return "¡Muy bien! 🎉";
  return "¡Gracias por jugar! 💛";
}

/** Fin de partida sin castigo: aciertos, mejor marca local y la opción de repetir. */
export function GameResult({ score, best, onReplay, onFinish }: GameResultProps) {
  return (
    <div role="status" className="flex flex-col items-center gap-4 rounded-card border-2 border-line bg-surface p-5 text-center shadow-soft">
      <ArtikoMascot emotion="celebrating" size={112} decorative />
      <p className="text-2xl font-black text-clinic">{headline(score)}</p>
      <p className="text-xl">
        Acertaste {score.correct} de {score.total}.
      </p>
      {best && (
        <p className="text-lg text-muted">
          Tu mejor marca: {best.correct} de {best.total}
        </p>
      )}
      <p className="text-lg">Cada respuesta, correcta o no, es algo nuevo que aprendiste.</p>
      <div className="grid w-full gap-2">
        <GameButton tone="vital" block haptic="success" onClick={onFinish}>
          Terminar y sumar XP ⭐
        </GameButton>
        <GameButton tone="surface" block onClick={onReplay}>
          Jugar de nuevo
        </GameButton>
      </div>
    </div>
  );
}
