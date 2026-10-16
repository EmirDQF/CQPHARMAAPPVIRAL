import { gameProgressStore, type GameProgress } from "../gamification/progress";
import { visibleLessons } from "../learn/lessons";
import type { ContentSource } from "../learn/schemas";
import { getMotivationalPhrase, limaDayNumber } from "../motivation/phrases";

/**
 * Cofre del día: un dato educativo y una frase, una vez por día de Lima. No da
 * XP ni descuentos: es un detalle para volver con gusto, sin presión.
 */
export interface DailyChestContent {
  fact: string;
  factTitle: string;
  source: ContentSource;
  phrase: string;
}

/** Saltos coprimos con el total de fichas: días seguidos traen temas distintos. */
const FACT_STEP = 5;

export function dailyChestContent(referenceDate: Date, hasRedFlag: boolean): DailyChestContent {
  const lessons = visibleLessons(hasRedFlag);
  const lesson = lessons[(limaDayNumber(referenceDate) * FACT_STEP) % lessons.length];
  return {
    fact: lesson.keyPoint,
    factTitle: lesson.title,
    source: lesson.source,
    phrase: getMotivationalPhrase(referenceDate, 0, { hasRedFlag }).text,
  };
}

export function isChestOpened(progress: GameProgress, today: string): boolean {
  return progress.chestOpenedOn === today;
}

export function withChestOpened(progress: GameProgress, today: string): GameProgress {
  return isChestOpened(progress, today) ? progress : { ...progress, chestOpenedOn: today };
}

export function openDailyChest(today: string): void {
  if (gameProgressStore.hasUnreadableData()) return;
  const current = gameProgressStore.getSnapshot();
  const next = withChestOpened(current, today);
  if (next !== current) gameProgressStore.write(next);
}
