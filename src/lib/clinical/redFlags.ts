import type { PainLogEntry } from "../dashboard/types";
import { addDaysToIsoDate, lastNIsoDates } from "../utils/date";
import {
  SEVERE_PAIN_MIN_CONSECUTIVE_DAYS,
  SEVERE_PAIN_MIN_LEVEL,
  SEVERE_PAIN_WINDOW_DAYS,
  WHO_T_SCORE_OSTEOPOROSIS_MAX,
} from "./constants";

/**
 * Banderas rojas que obligan a mostrar la CTA de evaluación reumatológica por
 * encima de cualquier CTA de producto y a ocultar toda venta de suplementos.
 */
export type RedFlag =
  | "osteoporosis"
  | "low-bone-density-zscore"
  | "fracture-history"
  | "severe-pain-streak";

/** Motivo legible (es-PE) de cada bandera roja, para la app y los informes médicos. */
export const RED_FLAG_DESCRIPTION: Record<RedFlag, string> = {
  osteoporosis: "Tu última densitometría está en rango de osteoporosis (T-score ≤ -2.5).",
  "low-bone-density-zscore":
    "Tu densitometría tiene un valor bajo que requiere interpretación médica (Z-score).",
  "fracture-history": "Registraste antecedente de fractura.",
  "severe-pain-streak":
    "Registraste dolor de 8 o más durante 3 días seguidos en las últimas 2 semanas.",
};

interface RedFlagInput {
  worstTScore: number | null;
  /** Mujer premenopáusica u hombre < 50: no se etiqueta osteoporosis, pero sí se deriva. */
  requiresZScore?: boolean;
  /** null = el paciente aún no respondió. */
  hasFractureHistory: boolean | null;
  painEntries?: readonly PainLogEntry[];
  referenceDate?: Date;
}

/** Fechas con dolor ≥ 8 dentro de los últimos 14 días de Lima. */
function severePainDatesInWindow(
  entries: readonly PainLogEntry[],
  referenceDate: Date
): Set<string> {
  const window = new Set(lastNIsoDates(SEVERE_PAIN_WINDOW_DAYS, referenceDate));
  return new Set(
    entries
      .filter((entry) => entry.painLevel >= SEVERE_PAIN_MIN_LEVEL && window.has(entry.date))
      .map((entry) => entry.date)
  );
}

/** Días consecutivos de dolor severo que incluyen `date` (0 si ese día no es severo). */
function severeStreakLengthThrough(date: string, severeDates: Set<string>): number {
  if (!severeDates.has(date)) return 0;
  let daysBefore = 0;
  while (severeDates.has(addDaysToIsoDate(date, -(daysBefore + 1)))) daysBefore += 1;
  let daysAfter = 0;
  while (severeDates.has(addDaysToIsoDate(date, daysAfter + 1))) daysAfter += 1;
  return daysBefore + 1 + daysAfter;
}

/** Dolor ≥ 8 durante 3+ días consecutivos dentro de los últimos 14 días de Lima. */
export function hasSeverePainStreak(
  entries: readonly PainLogEntry[],
  referenceDate: Date = new Date()
): boolean {
  const severeDates = severePainDatesInWindow(entries, referenceDate);
  return [...severeDates].some(
    (date) => severeStreakLengthThrough(date, severeDates) >= SEVERE_PAIN_MIN_CONSECUTIVE_DAYS
  );
}

/** El registro forma parte de una racha de dolor severo que hoy activa la bandera roja. */
export function isPartOfSeverePainStreak(
  entry: PainLogEntry,
  entries: readonly PainLogEntry[],
  referenceDate: Date = new Date()
): boolean {
  const severeDates = severePainDatesInWindow(entries, referenceDate);
  return (
    severeStreakLengthThrough(entry.date, severeDates) >= SEVERE_PAIN_MIN_CONSECUTIVE_DAYS
  );
}

/**
 * Densitometría en rango de osteoporosis (peor T ≤ -2.5). Se trata como
 * importante para el reumatólogo aunque no sea el estudio más reciente.
 */
export function isRedFlagDexaScan(scan: {
  lumbarTScore: number;
  femoralNeckTScore: number;
}): boolean {
  return Math.min(scan.lumbarTScore, scan.femoralNeckTScore) <= WHO_T_SCORE_OSTEOPOROSIS_MAX;
}

export function detectRedFlags({
  worstTScore,
  requiresZScore = false,
  hasFractureHistory,
  painEntries = [],
  referenceDate = new Date(),
}: RedFlagInput): RedFlag[] {
  const flags: RedFlag[] = [];
  if (worstTScore !== null && worstTScore <= WHO_T_SCORE_OSTEOPOROSIS_MAX) {
    flags.push(requiresZScore ? "low-bone-density-zscore" : "osteoporosis");
  }
  if (hasFractureHistory === true) flags.push("fracture-history");
  if (hasSeverePainStreak(painEntries, referenceDate)) flags.push("severe-pain-streak");
  return flags;
}
