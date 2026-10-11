import { calculateStreak, isDoseComplete } from "../dashboard/pillbox";
import type { PainLogEntry, PillboxState } from "../dashboard/types";
import { addDaysToIsoDate, toLimaIsoDate } from "../utils/date";
import {
  REWARD_PROGRESS_VERSION,
  rewardProgressSchema,
  type RewardDefinition,
  type RewardProgress,
  type UnlockRule,
  type UnlockedReward,
} from "./schemas";

/**
 * Reglas puras de logros (hora de Lima). Solo cuentan actos de constancia:
 * días con todas las tomas (cada franja una sola vez) y días con chequeo. El
 * valor de dolor registrado no suma ni resta. Lo desbloqueado nunca se quita.
 */
export interface HabitStats {
  currentStreak: number;
  longestRun: number;
  completeDays: number;
  checkInDays: number;
  checkInThisMonth: boolean;
  /** Mayor pausa (días sin completar) antes de volver a completar un día. */
  longestGapBeforeReturn: number;
  month: string;
}

const MONTH_LENGTH = "YYYY-MM".length;
const MS_PER_DAY = 86_400_000;

function daysBetween(fromIso: string, toIso: string): number {
  const toUtc = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
  return Math.round((toUtc(toIso) - toUtc(fromIso)) / MS_PER_DAY);
}

function runStats(completeDates: readonly string[]): { longestRun: number; longestGap: number } {
  return completeDates.reduce(
    (acc, date, index) => {
      const previous = completeDates[index - 1];
      const gap = previous ? daysBetween(previous, date) - 1 : 0;
      const run = previous && addDaysToIsoDate(previous, 1) === date ? acc.run + 1 : 1;
      return { run, longestRun: Math.max(acc.longestRun, run), longestGap: Math.max(acc.longestGap, gap) };
    },
    { run: 0, longestRun: 0, longestGap: 0 }
  );
}

export function computeHabitStats(pillbox: PillboxState, painEntries: readonly PainLogEntry[], now: Date = new Date()): HabitStats {
  const today = toLimaIsoDate(now);
  const month = today.slice(0, MONTH_LENGTH);
  const completeDates = Object.keys(pillbox.takenDoseIdsByDate)
    .filter((date) => date <= today && isDoseComplete(pillbox, date))
    .sort();
  const checkInDates = new Set(painEntries.map((entry) => entry.date).filter((date) => date <= today));
  const { longestRun, longestGap } = runStats(completeDates);
  return {
    currentStreak: calculateStreak(pillbox, now).days,
    longestRun,
    completeDays: completeDates.length,
    checkInDays: checkInDates.size,
    checkInThisMonth: [...checkInDates].some((date) => date.startsWith(month)),
    longestGapBeforeReturn: longestGap,
    month,
  };
}

/** Clave de desbloqueo si la regla se cumple hoy; null si no. */
function qualifyingKey(reward: RewardDefinition, stats: HabitStats): string | null {
  const { rule } = reward;
  switch (rule.type) {
    case "streak":
      return stats.currentStreak >= rule.days ? reward.id : null;
    case "completeDays":
      return stats.completeDays >= rule.total ? reward.id : null;
    case "longestRun":
      return stats.longestRun >= rule.days ? reward.id : null;
    case "checkInDays":
      return stats.checkInDays >= rule.total ? reward.id : null;
    case "monthlyCheckIn":
      return stats.checkInThisMonth ? `${reward.id}:${stats.month}` : null;
    case "returnAfterBreak":
      return stats.longestGapBeforeReturn >= rule.gapDays ? reward.id : null;
  }
}

export interface RewardEvaluation {
  progress: RewardProgress;
  newlyUnlocked: UnlockedReward[];
}

/** Idempotente: sin novedades devuelve el mismo objeto `progress`. */
export function evaluateRewards(
  catalog: readonly RewardDefinition[],
  stats: HabitStats,
  progress: RewardProgress,
  today: string
): RewardEvaluation {
  const known = new Set(progress.unlocked.map((item) => item.key));
  const newlyUnlocked = catalog.flatMap((reward): UnlockedReward[] => {
    const key = qualifyingKey(reward, stats);
    return key && !known.has(key) ? [{ rewardId: reward.id, key, unlockedOn: today }] : [];
  });
  if (newlyUnlocked.length === 0) return { progress, newlyUnlocked };
  return { progress: { ...progress, unlocked: [...progress.unlocked, ...newlyUnlocked] }, newlyUnlocked };
}

export interface GoalProgress {
  current: number;
  target: number;
}

/** Avance hacia una meta aún bloqueada; null si la regla no se mide con una barra. */
export function goalProgress(rule: UnlockRule, stats: HabitStats): GoalProgress | null {
  const capped = (current: number, target: number) => ({ current: Math.min(current, target), target });
  switch (rule.type) {
    case "streak":
      return capped(stats.currentStreak, rule.days);
    case "completeDays":
      return capped(stats.completeDays, rule.total);
    case "longestRun":
      return capped(stats.longestRun, rule.days);
    case "checkInDays":
      return capped(stats.checkInDays, rule.total);
    case "monthlyCheckIn":
      return capped(stats.checkInThisMonth ? 1 : 0, 1);
    case "returnAfterBreak":
      return null;
  }
}

export function pendingCelebrations(progress: RewardProgress): UnlockedReward[] {
  const celebrated = new Set(progress.celebratedKeys);
  return progress.unlocked.filter((item) => !celebrated.has(item.key));
}

export function markCelebrated(progress: RewardProgress, keys: readonly string[]): RewardProgress {
  return { ...progress, celebratedKeys: [...new Set([...progress.celebratedKeys, ...keys])] };
}

const legacyProgressSchema = rewardProgressSchema.pick({ unlocked: true });

/** Lee artikare_rewards_v1 con migración; null = formato desconocido (el store no lo sobrescribe). */
export function migrateRewardProgress(raw: unknown): RewardProgress | null {
  const current = rewardProgressSchema.safeParse(raw);
  if (current.success) return current.data;
  const isUnversioned = typeof raw === "object" && raw !== null && !("version" in raw);
  const legacy = isUnversioned ? legacyProgressSchema.safeParse(raw) : null;
  if (!legacy?.success) return null;
  const { unlocked } = legacy.data;
  return { version: REWARD_PROGRESS_VERSION, unlocked, celebratedKeys: unlocked.map((item) => item.key) };
}
