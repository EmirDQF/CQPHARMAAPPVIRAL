import { roundSize, seededShuffle, type GameLevel } from "./miniGames";
import { RHEUMA_EDUCATION } from "./rheumaEducationData";
import type { MemoryPair, PlateItem, ShieldGroup } from "./rheumaEducationSchemas";

/**
 * Arma cada partida (pura y determinista por `seed`) a partir del contenido
 * validado. La dificultad solo agrega cartas; nunca agrega reloj.
 */
export interface ChoiceCard {
  id: string;
  prompt: string;
  emoji?: string;
  options: readonly string[];
  correct: string;
  explanation: string;
  source: string;
}

export const MYTH_OPTIONS = { myth: "Mito", fact: "Realidad" } as const;

export const SHIELD_OPTIONS: Readonly<Record<ShieldGroup, string>> = {
  cuida: "🛡️ Cuida mis huesos",
  consulta: "🩺 Amerita un control",
  "no-ayuda": "🚫 No ayuda",
};

const MYTH_ROUND = { base: 6, step: 2 };
const SHIELD_ROUND = { base: 6, step: 3 };
const QUIZ_ROUND = { base: 5, step: 2 };
const MEMORY_ROUND = { base: 4, step: 2 };
export const PLATE_CHOICES = 10;

export function mythCards(level: GameLevel, seed: number, data = RHEUMA_EDUCATION): ChoiceCard[] {
  const size = roundSize(level, MYTH_ROUND.base, MYTH_ROUND.step, data.myths.length);
  return seededShuffle(data.myths, seed)
    .slice(0, size)
    .map((item) => ({
      id: item.id,
      prompt: item.statement,
      options: [MYTH_OPTIONS.myth, MYTH_OPTIONS.fact],
      correct: item.isFact ? MYTH_OPTIONS.fact : MYTH_OPTIONS.myth,
      explanation: item.explanation,
      source: item.source,
    }));
}

export function shieldCards(level: GameLevel, seed: number, data = RHEUMA_EDUCATION): ChoiceCard[] {
  const size = roundSize(level, SHIELD_ROUND.base, SHIELD_ROUND.step, data.shield.length);
  return seededShuffle(data.shield, seed)
    .slice(0, size)
    .map((item) => ({
      id: item.id,
      prompt: item.label,
      emoji: item.emoji,
      options: Object.values(SHIELD_OPTIONS),
      correct: SHIELD_OPTIONS[item.group],
      explanation: item.explanation,
      source: item.source,
    }));
}

export function quizCards(level: GameLevel, seed: number, data = RHEUMA_EDUCATION): ChoiceCard[] {
  const pool = data.quiz.filter((item) => item.level <= level);
  const size = roundSize(level, QUIZ_ROUND.base, QUIZ_ROUND.step, pool.length);
  return seededShuffle(pool, seed)
    .slice(0, size)
    .map((item, index) => ({
      id: item.id,
      prompt: item.question,
      options: seededShuffle(item.options, seed + index + 1),
      correct: item.options[item.answerIndex],
      explanation: item.explanation,
      source: item.source,
    }));
}

export function plateFoods(seed: number, data = RHEUMA_EDUCATION): PlateItem[] {
  return seededShuffle(data.plate, seed).slice(0, PLATE_CHOICES);
}

export interface MemoryDeck {
  pairs: MemoryPair[];
  cards: { key: string; pairId: string; text: string }[];
}

export function memoryDeck(level: GameLevel, seed: number, data = RHEUMA_EDUCATION): MemoryDeck {
  const size = roundSize(level, MEMORY_ROUND.base, MEMORY_ROUND.step, data.memory.length);
  const pairs = seededShuffle(data.memory, seed).slice(0, size);
  const cards = pairs.flatMap((pair) => [
    { key: `${pair.id}-a`, pairId: pair.id, text: pair.term },
    { key: `${pair.id}-b`, pairId: pair.id, text: pair.match },
  ]);
  return { pairs, cards: seededShuffle(cards, seed + 1) };
}
