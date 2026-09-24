import { WHO_T_SCORE_OSTEOPOROSIS_MAX } from "./constants";

/**
 * Banderas rojas que obligan a mostrar la CTA de evaluación reumatológica por
 * encima de cualquier CTA de producto. El dolor ≥ 8 durante 3+ días se añade
 * en una fase posterior.
 */
export type RedFlag = "osteoporosis" | "fracture-history";

interface RedFlagInput {
  worstTScore: number | null;
  hasFractureHistory: boolean;
}

export function detectRedFlags({ worstTScore, hasFractureHistory }: RedFlagInput): RedFlag[] {
  const flags: RedFlag[] = [];
  if (worstTScore !== null && worstTScore <= WHO_T_SCORE_OSTEOPOROSIS_MAX) {
    flags.push("osteoporosis");
  }
  if (hasFractureHistory) flags.push("fracture-history");
  return flags;
}
