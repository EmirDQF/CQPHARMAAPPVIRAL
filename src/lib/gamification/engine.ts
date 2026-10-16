import type { Activity, ActivityCategory } from "../activities/schemas";
import type { PainLogEntry, PillboxState } from "../dashboard/types";
import type { ArtikoAccessory } from "../mascot/mascot";
import { addDaysToIsoDate } from "../utils/date";
import { computeGraceStreak, type StreakSummary } from "./graceStreak";
import { learnedKeys, learningDates, learningXpTotal } from "./learning";
import type { GameProgress, UnlockedItem } from "./progress";
import type { GameRule, GameUnlock } from "./unlocks";

/**
 * Reglas puras del juego (fechas de Lima). Todo se deriva del historial:
 * XP = suma del XP de cada actividad, una sola vez por actividad y día. El
 * valor de dolor no suma ni resta; comprar no da puntos. Nada se pierde.
 * Aprender (lecciones y juegos) suma XP con tope diario y cuenta como día activo.
 */
export const XP_PER_LEVEL = 100;
export const WEEK_DAYS = 7;

export interface GameSources {
  pillbox: PillboxState;
  painEntries: readonly PainLogEntry[];
  progress: GameProgress;
}

function derivedIdsOn(catalog: readonly Activity[], sources: GameSources, date: string): string[] {
  const taken = new Set(sources.pillbox.takenDoseIdsByDate[date] ?? []);
  const checkedIn = sources.painEntries.some((entry) => entry.date === date);
  return catalog
    .filter((activity) => (activity.kind === "dose" && taken.has(activity.doseId ?? "")) || (activity.kind === "check-in" && checkedIn))
    .map((activity) => activity.id);
}

export function completedOn(catalog: readonly Activity[], sources: GameSources, date: string): ReadonlySet<string> {
  const known = new Set(catalog.map((activity) => activity.id));
  const recorded = (sources.progress.completions[date] ?? []).filter((id) => known.has(id));
  return new Set([...derivedIdsOn(catalog, sources, date), ...recorded]);
}

function allDates(sources: GameSources): string[] {
  const dates = new Set([
    ...Object.keys(sources.pillbox.takenDoseIdsByDate),
    ...sources.painEntries.map((entry) => entry.date),
    ...Object.keys(sources.progress.completions),
  ]);
  return [...dates].sort();
}

export interface DayRecord {
  date: string;
  ids: ReadonlySet<string>;
}

/** Días con al menos una actividad completada, hasta `today`. */
export function activeDays(catalog: readonly Activity[], sources: GameSources, today: string): DayRecord[] {
  return allDates(sources)
    .filter((date) => date <= today)
    .map((date) => ({ date, ids: completedOn(catalog, sources, date) }))
    .filter((day) => day.ids.size > 0);
}

export function totalXp(catalog: readonly Activity[], days: readonly DayRecord[]): number {
  const xpById = new Map(catalog.map((activity) => [activity.id, activity.xp]));
  return days.reduce((sum, day) => sum + [...day.ids].reduce((daySum, id) => daySum + (xpById.get(id) ?? 0), 0), 0);
}

export interface LevelInfo {
  level: number;
  xpIntoLevel: number;
  xpForLevel: number;
}

export function levelFromXp(xp: number): LevelInfo {
  return { level: Math.floor(xp / XP_PER_LEVEL) + 1, xpIntoLevel: xp % XP_PER_LEVEL, xpForLevel: XP_PER_LEVEL };
}

export interface GoalStatus {
  done: number;
  goal: number;
  met: boolean;
}

export function dailyGoalStatus(missions: readonly Activity[], completed: ReadonlySet<string>, goal: number): GoalStatus {
  const done = missions.filter((mission) => completed.has(mission.id)).length;
  return { done, goal, met: done >= goal };
}

/** Lunes (YYYY-MM-DD) de la semana de Lima que contiene `date`. */
export function weekStartOf(date: string): string {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  const daysSinceMonday = (weekday + WEEK_DAYS - 1) % WEEK_DAYS;
  return addDaysToIsoDate(date, -daysSinceMonday);
}

export interface WeeklyChallenge {
  weekStart: string;
  activeDays: number;
  target: number;
  done: boolean;
  /** Lunes a domingo: true si ese día hubo al menos una misión. */
  activeByWeekday: readonly boolean[];
}

export function weeklyChallenge(days: readonly DayRecord[], today: string): WeeklyChallenge {
  const weekStart = weekStartOf(today);
  const activeDates = new Set(days.filter((day) => day.date >= weekStart && day.date <= today).map((day) => day.date));
  const activeByWeekday = Array.from({ length: WEEK_DAYS }, (_, index) => activeDates.has(addDaysToIsoDate(weekStart, index)));
  return { weekStart, activeDays: activeDates.size, target: WEEK_DAYS, done: activeDates.size >= WEEK_DAYS, activeByWeekday };
}

export interface GameStats {
  xp: number;
  level: LevelInfo;
  streak: StreakSummary;
  activeDayCount: number;
  goalDayCount: number;
  categoryDays: Readonly<Record<ActivityCategory, number>>;
  week: WeeklyChallenge;
  /** Lecciones y juegos distintos completados alguna vez ("lesson:<id>", "game:<id>"). */
  learned: ReadonlySet<string>;
}

function countCategoryDays(catalog: readonly Activity[], days: readonly DayRecord[]): Record<ActivityCategory, number> {
  const categoryById = new Map(catalog.map((activity) => [activity.id, activity.category]));
  const empty: Record<ActivityCategory, number> = { registro: 0, cuerpo: 0, habitos: 0, mente: 0, social: 0 };
  return days.reduce((counts, day) => {
    const categories = new Set([...day.ids].flatMap((id) => categoryById.get(id) ?? []));
    return Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, value + (categories.has(key as ActivityCategory) ? 1 : 0)])) as Record<ActivityCategory, number>;
  }, empty);
}

export function computeGameStats(catalog: readonly Activity[], sources: GameSources, today: string, dailyGoal: number): GameStats {
  const days = activeDays(catalog, sources, today);
  const learning = sources.progress.learning ?? {};
  const xp = totalXp(catalog, days) + learningXpTotal(learning, today);
  const activeDates = new Set([...days.map((day) => day.date), ...learningDates(learning, today)]);
  return {
    xp,
    level: levelFromXp(xp),
    streak: computeGraceStreak(activeDates, today),
    activeDayCount: activeDates.size,
    goalDayCount: days.filter((day) => day.ids.size >= dailyGoal).length,
    categoryDays: countCategoryDays(catalog, days),
    // El reto semanal también cuenta los días en que solo se aprendió (lección o juego).
    week: weeklyChallenge([...activeDates].map((date) => ({ date, ids: new Set<string>() })), today),
    learned: learnedKeys(learning),
  };
}

function qualifyingKey(unlock: GameUnlock, stats: GameStats): string | null {
  const rule: GameRule = unlock.rule;
  switch (rule.type) {
    case "activeDays":
      return stats.activeDayCount >= rule.total ? unlock.id : null;
    case "goalDays":
      return stats.goalDayCount >= rule.total ? unlock.id : null;
    case "level":
      return stats.level.level >= rule.level ? unlock.id : null;
    case "streak":
      return stats.streak.days >= rule.days ? unlock.id : null;
    case "categoryDays":
      return stats.categoryDays[rule.category] >= rule.total ? unlock.id : null;
    case "weeklyChallenge":
      return stats.week.done ? `${unlock.id}:${stats.week.weekStart}` : null;
    case "learningCount":
      return [...stats.learned].filter((key) => key.startsWith(`${rule.kind}:`)).length >= rule.total ? unlock.id : null;
    case "learningSet":
      return rule.keys.every((key) => stats.learned.has(key)) ? unlock.id : null;
  }
}

/** Idempotente: sin novedades devuelve el mismo objeto `progress`. */
export function evaluateUnlocks(
  unlocks: readonly GameUnlock[],
  stats: GameStats,
  progress: GameProgress,
  today: string
): { progress: GameProgress; newlyUnlocked: UnlockedItem[] } {
  const known = new Set(progress.unlocked.map((item) => item.key));
  const newlyUnlocked = unlocks.flatMap((unlock): UnlockedItem[] => {
    const key = qualifyingKey(unlock, stats);
    return key && !known.has(key) ? [{ key, unlockId: unlock.id, on: today }] : [];
  });
  if (newlyUnlocked.length === 0) return { progress, newlyUnlocked };
  return { progress: { ...progress, unlocked: [...progress.unlocked, ...newlyUnlocked] }, newlyUnlocked };
}

export function unlockedAccessories(unlocks: readonly GameUnlock[], progress: GameProgress): ArtikoAccessory[] {
  const unlockedIds = new Set(progress.unlocked.map((item) => item.unlockId));
  return unlocks.flatMap((unlock) => (unlock.accessory && unlockedIds.has(unlock.id) ? [unlock.accessory] : []));
}
