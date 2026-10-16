import { gameProgressStore, type GameProgress } from "./progress";

/**
 * XP por aprender (lecciones y mini-juegos) con TOPE DIARIO: se puede repetir
 * todo lo que se quiera, pero cada lección o juego suma una sola vez por día
 * de Lima y el total del día nunca pasa de `DAILY_LEARNING_XP_CAP`. No hay
 * puntos por acertar más ni por compras: solo por dedicar un rato a aprender.
 */
export const LEARNING_KINDS = ["lesson", "game"] as const;
export type LearningKind = (typeof LEARNING_KINDS)[number];

export const LEARNING_XP: Readonly<Record<LearningKind, number>> = { lesson: 10, game: 15 };
export const DAILY_LEARNING_XP_CAP = 40;

export function learningKey(kind: LearningKind, id: string): string {
  return `${kind}:${id}`;
}

function xpOfKey(key: string): number {
  const kind = key.split(":")[0] as LearningKind;
  return LEARNING_XP[kind] ?? 0;
}

/** XP de un día: suma de lo completado, nunca más que el tope. */
export function learningXpOn(keys: readonly string[]): number {
  return Math.min(DAILY_LEARNING_XP_CAP, keys.reduce((sum, key) => sum + xpOfKey(key), 0));
}

export function learningXpTotal(learning: GameProgress["learning"], today: string): number {
  return Object.entries(learning)
    .filter(([date]) => date <= today)
    .reduce((sum, [, keys]) => sum + learningXpOn(keys), 0);
}

export function learningDates(learning: GameProgress["learning"], today: string): string[] {
  return Object.entries(learning)
    .filter(([date, keys]) => date <= today && keys.length > 0)
    .map(([date]) => date);
}

/** Ids distintos completados alguna vez (para insignias de aprendizaje). */
export function learnedKeys(learning: GameProgress["learning"]): ReadonlySet<string> {
  return new Set(Object.values(learning).flat());
}

export interface LearningResult {
  progress: GameProgress;
  /** XP que de verdad sumó este intento (0 si ya contaba hoy o se llegó al tope). */
  awardedXp: number;
  /** true si ya se alcanzó el tope del día tras este intento. */
  capReached: boolean;
}

export function withLearningCompleted(progress: GameProgress, kind: LearningKind, id: string, date: string): LearningResult {
  const done = progress.learning[date] ?? [];
  const key = learningKey(kind, id);
  const before = learningXpOn(done);
  if (done.includes(key)) return { progress, awardedXp: 0, capReached: before >= DAILY_LEARNING_XP_CAP };
  const nextKeys = [...done, key];
  const after = learningXpOn(nextKeys);
  return {
    progress: { ...progress, learning: { ...progress.learning, [date]: nextKeys } },
    awardedXp: after - before,
    capReached: after >= DAILY_LEARNING_XP_CAP,
  };
}

/** Guarda la lección o el juego completado; sin datos legibles no escribe ni premia. */
export function recordLearning(kind: LearningKind, id: string, date: string): Omit<LearningResult, "progress"> {
  if (gameProgressStore.hasUnreadableData()) return { awardedXp: 0, capReached: false };
  const current = gameProgressStore.getSnapshot();
  const { progress, awardedXp, capReached } = withLearningCompleted(current, kind, id, date);
  if (progress !== current) gameProgressStore.write(progress);
  return { awardedXp, capReached };
}
