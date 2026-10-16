import { z } from "zod";
import { createPersistentStore } from "../storage/persistentStore";

/**
 * Mini-juegos educativos: catálogo, dificultad adaptable y mejor puntaje
 * local. Sin reloj (nunca hay presión de tiempo), sin rankings y sin castigo:
 * la dificultad solo sube cuando la persona acierta mucho y nunca baja.
 */
export const MINI_GAME_IDS = [
  "mito-o-realidad",
  "escudo-oseo",
  "arma-tu-plato",
  "casa-segura",
  "memoria-articular",
  "quiz-reumatologia",
] as const;
export type MiniGameId = (typeof MINI_GAME_IDS)[number];

export interface MiniGame {
  id: MiniGameId;
  emoji: string;
  title: string;
  description: string;
  minutes: number;
  /** Sugiere movimiento o hábitos físicos: se oculta con una bandera roja. */
  suggestsMovement: boolean;
}

export const MINI_GAMES: readonly MiniGame[] = [
  { id: "mito-o-realidad", emoji: "🤔", title: "Mito o Realidad", description: "¿Cierto o falso? Descubre qué dice la evidencia.", minutes: 2, suggestsMovement: false },
  { id: "escudo-oseo", emoji: "🛡️", title: "Escudo Óseo del Día", description: "Elige qué cuida tus huesos y qué amerita un control.", minutes: 2, suggestsMovement: true },
  { id: "arma-tu-plato", emoji: "🍽️", title: "Arma tu plato", description: "Elige alimentos con calcio y vitamina D.", minutes: 1, suggestsMovement: false },
  { id: "casa-segura", emoji: "🏠", title: "Casa segura", description: "Encuentra los riesgos de caída en la casa.", minutes: 2, suggestsMovement: false },
  { id: "memoria-articular", emoji: "🧠", title: "Memoria articular", description: "Une cada palabra con su significado.", minutes: 3, suggestsMovement: false },
  { id: "quiz-reumatologia", emoji: "🎓", title: "Quiz de reumatología", description: "Preguntas por niveles, a tu ritmo.", minutes: 2, suggestsMovement: false },
];

export function visibleGames(hasRedFlag: boolean): readonly MiniGame[] {
  return hasRedFlag ? MINI_GAMES.filter((game) => !game.suggestsMovement) : MINI_GAMES;
}

export const MAX_LEVEL = 3;
export type GameLevel = 1 | 2 | 3;
/** Acierto mínimo (proporción) para subir de nivel la próxima vez. */
export const LEVEL_UP_RATIO = 0.8;

export function nextLevel(level: GameLevel, correct: number, total: number): GameLevel {
  if (total <= 0 || correct / total < LEVEL_UP_RATIO) return level;
  return Math.min(MAX_LEVEL, level + 1) as GameLevel;
}

/** Cartas por partida según el nivel: más contenido, nunca menos tiempo. */
export function roundSize(level: GameLevel, base: number, step: number, available: number): number {
  return Math.min(available, base + (level - 1) * step);
}

/** Barajado determinista (mulberry32): mismo `seed`, mismo orden. No muta la lista. */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  let state = seed >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  return items
    .map((item) => ({ item, key: random() }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item);
}

const scoreSchema = z.object({ correct: z.number().int().min(0), total: z.number().int().min(1) });
export type GameScore = z.infer<typeof scoreSchema>;

const levelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
const scoresSchema = z.object({
  version: z.literal(1),
  best: z.partialRecord(z.enum(MINI_GAME_IDS), scoreSchema).catch({}),
  level: z.partialRecord(z.enum(MINI_GAME_IDS), levelSchema).catch({}),
});
export type MiniGameScores = z.infer<typeof scoresSchema>;

export const EMPTY_MINI_GAME_SCORES: MiniGameScores = { version: 1, best: {}, level: {} };

export const miniGameScoresStore = createPersistentStore<MiniGameScores>(
  "artikare_minigames_v1",
  EMPTY_MINI_GAME_SCORES,
  (raw) => {
    const parsed = scoresSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  }
);

function isBetter(candidate: GameScore, current: GameScore | undefined): boolean {
  return !current || candidate.correct / candidate.total > current.correct / current.total;
}

export function withGameResult(scores: MiniGameScores, id: MiniGameId, result: GameScore): MiniGameScores {
  const level = nextLevel(scores.level[id] ?? 1, result.correct, result.total);
  return {
    ...scores,
    best: isBetter(result, scores.best[id]) ? { ...scores.best, [id]: result } : scores.best,
    level: { ...scores.level, [id]: level },
  };
}

export function recordGameResult(id: MiniGameId, result: GameScore): void {
  if (miniGameScoresStore.hasUnreadableData()) return;
  miniGameScoresStore.write(withGameResult(miniGameScoresStore.getSnapshot(), id, result));
}
