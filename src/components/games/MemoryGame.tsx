"use client";

import { useState } from "react";
import { triggerHaptic } from "@/lib/feedback/haptics";
import { playSound } from "@/lib/feedback/sounds";
import type { MemoryDeck } from "@/lib/gamification/gameRounds";
import type { GameScore } from "@/lib/gamification/miniGames";
import type { MemoryPair } from "@/lib/gamification/rheumaEducationSchemas";
import { GameFrame } from "./GameFrame";

type MemoryCard = MemoryDeck["cards"][number];

interface MemoryGameProps {
  pairs: readonly MemoryPair[];
  cards: readonly MemoryCard[];
  onExit: () => void;
  onRoundEnd: (score: GameScore) => void;
}

/**
 * Une cada término con su significado. Sin reloj: dos cartas distintas
 * quedan a la vista hasta el siguiente toque, para leerlas con calma.
 */
export function MemoryGame({ pairs, cards, onExit, onRoundEnd }: MemoryGameProps) {
  const [open, setOpen] = useState<readonly string[]>([]);
  const [matched, setMatched] = useState<readonly string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [lastMatch, setLastMatch] = useState<MemoryPair | null>(null);
  const byKey = new Map(cards.map((card) => [card.key, card]));
  const isDone = matched.length === pairs.length;

  function flip(card: MemoryCard) {
    if (matched.includes(card.pairId) || open.includes(card.key)) return;
    const visible = open.length >= 2 ? [card.key] : [...open, card.key];
    setOpen(visible);
    if (visible.length < 2) return;
    const [first, second] = visible.map((key) => byKey.get(key));
    const isMatch = first?.pairId === second?.pairId;
    setAttempts((count) => count + 1);
    playSound(isMatch ? "correct" : "softError");
    void triggerHaptic(isMatch ? "success" : "light");
    if (!isMatch || !first) return;
    setMatched([...matched, first.pairId]);
    setLastMatch(pairs.find((pair) => pair.id === first.pairId) ?? null);
    setOpen([]);
  }

  return (
    <GameFrame title="Memoria articular" step={matched.length} total={pairs.length} emotion={lastMatch ? "happy" : "thinking"} onExit={onExit}>
      <p className="text-lg">Toca dos cartas para unir cada palabra con su significado.</p>
      <ul className="grid grid-cols-2 gap-3">
        {cards.map((card) => {
          const isMatched = matched.includes(card.pairId);
          const isOpen = isMatched || open.includes(card.key);
          return (
            <li key={card.key}>
              <button
                type="button"
                onClick={() => flip(card)}
                aria-label={isOpen ? card.text : "Carta tapada"}
                aria-pressed={isOpen}
                className={`press-scale flex min-h-24 w-full items-center justify-center rounded-control border-2 p-2 text-center text-lg font-bold ${
                  isMatched ? "border-vital-deep bg-vital text-vital-ink" : isOpen ? "border-sky-deep bg-sky text-sky-ink" : "border-line bg-pastel-lavender text-pastel-lavender-ink"
                }`}
              >
                {isOpen ? card.text : <span aria-hidden="true" className="text-3xl">❓</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {lastMatch && (
        <p role="status" className="rounded-control bg-pastel-sky px-4 py-3 text-lg text-pastel-sky-ink">
          <strong>{lastMatch.term}:</strong> {lastMatch.explanation}
        </p>
      )}
      {isDone && (
        <button
          type="button"
          onClick={() => onRoundEnd({ correct: pairs.length, total: Math.max(attempts, pairs.length) })}
          className="press-scale min-h-14 rounded-control border-2 border-vital-deep bg-vital text-xl font-extrabold text-vital-ink"
        >
          Ver resultado
        </button>
      )}
    </GameFrame>
  );
}
