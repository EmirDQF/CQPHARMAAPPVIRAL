"use client";

import { useState } from "react";
import { triggerHaptic } from "@/lib/feedback/haptics";
import { playSound } from "@/lib/feedback/sounds";
import type { GameScore } from "@/lib/gamification/miniGames";
import type { PlateItem } from "@/lib/gamification/rheumaEducationSchemas";
import { GameFrame } from "./GameFrame";

export const PLATE_SLOTS = 4;

interface PlateGameProps {
  foods: readonly PlateItem[];
  onExit: () => void;
  onRoundEnd: (score: GameScore) => void;
}

const NUTRIENT_LABEL: Record<PlateItem["nutrient"], string> = {
  calcio: "Aporta calcio",
  "vitamina-d": "Aporta vitamina D",
  ambos: "Aporta calcio y vitamina D",
  poco: "Aporta poco calcio o vitamina D",
};

/** Elige 4 alimentos para un plato que acompañe tus huesos. Sin dietas milagro. */
export function PlateGame({ foods, onExit, onRoundEnd }: PlateGameProps) {
  const [picked, setPicked] = useState<readonly PlateItem[]>([]);
  const last = picked[picked.length - 1];
  const isFull = picked.length >= PLATE_SLOTS;
  const goodCount = picked.filter((food) => food.nutrient !== "poco").length;

  function pick(food: PlateItem) {
    if (isFull || picked.includes(food)) return;
    const good = food.nutrient !== "poco";
    setPicked([...picked, food]);
    playSound(good ? "correct" : "softError");
    void triggerHaptic(good ? "success" : "light");
  }

  return (
    <GameFrame title="Arma tu plato" step={picked.length} total={PLATE_SLOTS} emotion={last?.nutrient === "poco" ? "waiting" : "happy"} onExit={onExit}>
      <p className="text-lg">Elige {PLATE_SLOTS} alimentos que aporten calcio o vitamina D.</p>
      <div aria-label="Tu plato" role="list" className="mx-auto flex size-56 flex-wrap content-center items-center justify-center gap-2 rounded-full border-8 border-pastel-sky-edge bg-surface p-6 shadow-soft">
        {picked.length === 0 && <p className="text-center text-lg text-muted">Tu plato está vacío</p>}
        {picked.map((food) => (
          <span key={food.id} role="listitem" aria-label={food.name} className="animate-fade-in text-5xl">
            {food.emoji}
          </span>
        ))}
      </div>
      {last && (
        <div role="status" className="rounded-control bg-pastel-sky px-4 py-3 text-pastel-sky-ink">
          <p className="text-xl font-black">
            {last.name}: {NUTRIENT_LABEL[last.nutrient]}
          </p>
          <p className="text-lg">{last.explanation}</p>
        </div>
      )}
      {isFull ? (
        <button
          type="button"
          onClick={() => onRoundEnd({ correct: goodCount, total: PLATE_SLOTS })}
          className="press-scale min-h-14 rounded-control border-2 border-vital-deep bg-vital text-xl font-extrabold text-vital-ink"
        >
          Ver resultado
        </button>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {foods.map((food) => (
            <li key={food.id}>
              <button
                type="button"
                onClick={() => pick(food)}
                aria-pressed={picked.includes(food)}
                disabled={picked.includes(food)}
                className="press-scale flex min-h-16 w-full items-center gap-2 rounded-control border-2 border-line bg-surface px-3 text-left text-lg font-bold disabled:opacity-60"
              >
                <span aria-hidden="true" className="text-3xl">
                  {food.emoji}
                </span>
                {food.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </GameFrame>
  );
}
