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

/** Dolor ≥ 8 durante 3+ días consecutivos dentro de los últimos 14 días de Lima. */
export function hasSeverePainStreak(
  entries: readonly PainLogEntry[],
  referenceDate: Date = new Date()
): boolean {
  const window = new Set(lastNIsoDates(SEVERE_PAIN_WINDOW_DAYS, referenceDate));
  const severeDates = new Set(
    entries
      .filter((entry) => entry.painLevel >= SEVERE_PAIN_MIN_LEVEL && window.has(entry.date))
      .map((entry) => entry.date)
  );

  for (const date of severeDates) {
    let streakLength = 1;
    while (severeDates.has(addDaysToIsoDate(date, streakLength))) streakLength += 1;
    if (streakLength >= SEVERE_PAIN_MIN_CONSECUTIVE_DAYS) return true;
  }
  return false;
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
