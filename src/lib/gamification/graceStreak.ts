import { STREAK_DAYS_PER_SHIELD, STREAK_MAX_SHIELDS } from "../clinical/constants";
import { addDaysToIsoDate } from "../utils/date";

export interface StreakSummary {
  /** Días activos de la racha vigente (los días cubiertos por un escudo no suman). */
  days: number;
  /** Días de gracia ("escudos" o "racha congelada") disponibles. */
  shields: number;
  todayComplete: boolean;
  /** Último día de la racha vigente que cubrió un escudo, o null. */
  shieldUsedOn: string | null;
}

export const EMPTY_STREAK: StreakSummary = { days: 0, shields: 0, todayComplete: false, shieldUsedOn: null };

/**
 * Racha justa con días de gracia, en fechas de Lima, derivada del historial
 * (nunca un contador guardado aparte). La usan el pastillero (día = todas las
 * tomas) y el juego (día = al menos una misión):
 * - Si hoy sigue pendiente, la racha cuenta hasta ayer (no cae a 0 cada mañana).
 * - Cada `STREAK_DAYS_PER_SHIELD` días activos se gana un día de gracia
 *   (máx. `STREAK_MAX_SHIELDS`), que cubre un día sin actividad.
 * - Un día sin actividad y sin gracia reinicia la racha (el XP y los logros nunca se pierden).
 */
export function computeGraceStreak(activeDates: ReadonlySet<string>, today: string): StreakSummary {
  const firstDate = [...activeDates].filter((date) => date <= today).sort()[0];
  if (!firstDate) return EMPTY_STREAK;

  const todayComplete = activeDates.has(today);
  const lastDate = todayComplete ? today : addDaysToIsoDate(today, -1);
  let summary = { ...EMPTY_STREAK, todayComplete };
  let daysTowardShield = 0;

  for (let cursor = firstDate; cursor <= lastDate; cursor = addDaysToIsoDate(cursor, 1)) {
    if (activeDates.has(cursor)) {
      daysTowardShield += 1;
      const earnsShield = daysTowardShield === STREAK_DAYS_PER_SHIELD;
      if (earnsShield) daysTowardShield = 0;
      summary = {
        ...summary,
        days: summary.days + 1,
        shields: earnsShield ? Math.min(STREAK_MAX_SHIELDS, summary.shields + 1) : summary.shields,
      };
    } else if (summary.shields > 0) {
      summary = { ...summary, shields: summary.shields - 1, shieldUsedOn: cursor };
    } else {
      daysTowardShield = 0;
      summary = { ...EMPTY_STREAK, todayComplete };
    }
  }
  return summary;
}
