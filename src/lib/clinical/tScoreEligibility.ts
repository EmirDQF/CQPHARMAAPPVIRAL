import type { Sex } from "../types";
import { T_SCORE_ELIGIBILITY_MIN_AGE } from "./constants";

export const MENOPAUSAL_STATUSES = ["premenopausica", "posmenopausica", "no-aplica"] as const;
export type MenopausalStatus = (typeof MENOPAUSAL_STATUSES)[number];

/**
 * - `t-score`: semáforo OMS válido (mujer posmenopáusica u hombre ≥ 50).
 * - `t-score-assumed`: mujer ≥ 50 sin estado menopáusico; OMS con nota precautoria.
 * - `incomplete-profile`: faltan datos; clasificación OMS preliminar con aviso.
 * - `z-score-required`: mujer premenopáusica u hombre < 50; sin semáforo OMS.
 */
export type BoneDensityInterpretation =
  | "t-score"
  | "t-score-assumed"
  | "incomplete-profile"
  | "z-score-required";

export interface BoneDensityPatient {
  age: number | null;
  sex: Sex | null;
  menopausalStatus: MenopausalStatus | null;
}

export const Z_SCORE_REQUIRED_LABEL = "Consulte a su médico (Z-score)";

export const INTERPRETATION_NOTE: Record<BoneDensityInterpretation, string | null> = {
  "t-score": null,
  "t-score-assumed":
    "Clasificación OMS asumida por tu edad. Confirma tu estado menopáusico con tu médico.",
  "incomplete-profile": "Completa tu perfil para una evaluación exacta.",
  "z-score-required": null,
};

/** Regla de CLAUDE.md: el T-score aplica a mujeres posmenopáusicas y a hombres ≥ 50 años. */
export function getBoneDensityInterpretation({
  age,
  sex,
  menopausalStatus,
}: BoneDensityPatient): BoneDensityInterpretation {
  if (sex === "masculino") {
    if (age === null) return "incomplete-profile";
    return age >= T_SCORE_ELIGIBILITY_MIN_AGE ? "t-score" : "z-score-required";
  }
  if (sex === "femenino") {
    if (menopausalStatus === "posmenopausica") return "t-score";
    if (menopausalStatus === "premenopausica") return "z-score-required";
    if (age === null) return "incomplete-profile";
    // Sin estado menopáusico: desde los 50 se asume OMS; antes, Z-score (CLAUDE.md: "en menores").
    return age >= T_SCORE_ELIGIBILITY_MIN_AGE ? "t-score-assumed" : "z-score-required";
  }
  return "incomplete-profile";
}
