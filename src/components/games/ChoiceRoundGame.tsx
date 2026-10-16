"use client";

import { useState } from "react";
import { GameButton } from "@/components/ui/GameButton";
import { triggerHaptic } from "@/lib/feedback/haptics";
import { playSound } from "@/lib/feedback/sounds";
import type { ChoiceCard } from "@/lib/gamification/gameRounds";
import type { GameScore } from "@/lib/gamification/miniGames";
import type { ArtikoEmotion } from "@/lib/mascot/mascot";
import { GameFrame } from "./GameFrame";

interface ChoiceRoundGameProps {
  title: string;
  cards: readonly ChoiceCard[];
  onExit: () => void;
  onRoundEnd: (score: GameScore) => void;
}

/** Una carta a la vez, sin reloj: elegir, leer la explicación y seguir. */
export function ChoiceRoundGame({ title, cards, onExit, onRoundEnd }: ChoiceRoundGameProps) {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const card = cards[index];
  const isRight = chosen === card.correct;
  const emotion: ArtikoEmotion = chosen === null ? "thinking" : isRight ? "happy" : "waiting";

  function answer(option: string) {
    if (chosen !== null) return;
    const right = option === card.correct;
    setChosen(option);
    if (right) setCorrectCount((count) => count + 1);
    playSound(right ? "correct" : "softError");
    void triggerHaptic(right ? "success" : "light");
  }

  function next() {
    if (index + 1 >= cards.length) {
      onRoundEnd({ correct: correctCount, total: cards.length });
      return;
    }
    setIndex(index + 1);
    setChosen(null);
  }

  return (
    <GameFrame title={title} step={index + 1} total={cards.length} emotion={emotion} onExit={onExit}>
      <p key={card.id} className="animate-fade-in rounded-card border-2 border-line bg-surface p-5 text-2xl font-black shadow-soft">
        {card.emoji && <span aria-hidden="true">{card.emoji} </span>}
        {card.prompt}
      </p>
      <div role="group" aria-label="Opciones" className="flex flex-col gap-3">
        {card.options.map((option) => (
          <GameButton
            key={option}
            tone={chosen !== null && option === card.correct ? "vital" : "surface"}
            size="xl"
            block
            haptic={false}
            aria-pressed={chosen === option}
            aria-disabled={chosen !== null}
            onClick={() => answer(option)}
          >
            {option}
            {chosen !== null && option === card.correct && <span aria-hidden="true"> ✅</span>}
          </GameButton>
        ))}
      </div>
      {chosen !== null && (
        <div role="status" className="flex flex-col gap-2 rounded-control bg-pastel-sky px-4 py-3 text-pastel-sky-ink">
          <p className="text-xl font-black">{isRight ? "¡Correcto! 🎉" : "Casi. Mira por qué: 💡"}</p>
          <p className="text-lg">{card.explanation}</p>
          <p className="text-lg">Referencia general: {card.source}</p>
        </div>
      )}
      {chosen !== null && (
        <GameButton tone="vital" block onClick={next}>
          {index + 1 >= cards.length ? "Ver resultado" : "Siguiente"}
        </GameButton>
      )}
    </GameFrame>
  );
}
