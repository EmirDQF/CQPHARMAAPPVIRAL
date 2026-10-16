import { MOTIVATIONAL_PHRASES, getMotivationalPhrase, type PhraseOptions } from "../motivation/phrases";

/**
 * Frases neutras que valoran el acto de registrar y cuidarse, nunca un valor
 * clínico ni un producto. Viven en `lib/motivation/phrases.ts`; se validan con
 * `findForbiddenPhrases` en el test.
 */
export const DAILY_PHRASES: readonly string[] = MOTIVATIONAL_PHRASES.map((item) => item.text);

export interface DailyPhraseOptions extends PhraseOptions {
  /** Veces que se tocó "Otra frase" hoy. */
  offset?: number;
}

/** Frase del día: determinista por fecha de Lima y sin repetirse en 14 días. */
export function getDailyPhrase(
  referenceDate: Date = new Date(),
  { offset = 0, hasRedFlag = false }: DailyPhraseOptions = {}
): string {
  return getMotivationalPhrase(referenceDate, offset, { hasRedFlag }).text;
}

function normalizeStreakDays(streakDays: number): number {
  return Number.isFinite(streakDays) && streakDays > 0 ? Math.floor(streakDays) : 0;
}

/** Lema de racha + frase del día. Premia el hábito, no el resultado clínico. */
export function buildDailyReinforcementMessage(
  streakDays: number,
  referenceDate: Date = new Date(),
  options: DailyPhraseOptions = {}
): string {
  const phrase = getDailyPhrase(referenceDate, options);
  const days = normalizeStreakDays(streakDays);

  if (days === 0) {
    return `Hoy es un buen día para empezar a cuidar tu movilidad. ${phrase}`;
  }
  return `${days} ${days === 1 ? "día" : "días"} cuidando tu movilidad. ${phrase}`;
}
