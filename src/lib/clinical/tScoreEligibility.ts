import { z } from "zod";
import type { Sex } from "../types";
import { T_SCORE_ELIGIBILITY_MIN_AGE } from "./constants";

export const MENOPAUSAL_STATUSES = ["premenopausica", "posmenopausica", "no-segura", "no-decir"] as const;
export type MenopausalStatus = (typeof MENOPAUSAL_STATUSES)[number];

/** Valor combinado anterior ("No sé / Prefiero no decirlo"); sigue existiendo en la base. */
const LEGACY_UNSURE_STATUS = "no-aplica";

/** Acepta perfiles antiguos: `no-aplica` se migra a `no-segura` (misma lógica: incierto). */
export const menopausalStatusSchema = z.preprocess(
  (value) => (value === LEGACY_UNSURE_STATUS ? "no-segura" : value),
  z.enum(MENOPAUSAL_STATUSES)
);

const UNCERTAIN_STATUSES: ReadonlySet<MenopausalStatus> = new Set(["no-segura", "no-decir"]);

export const MENOPAUSE_UNCERTAIN_NOTE = "Tu médico confirmará esto contigo.";

/**
 * - `t-score`: semáforo OMS válido (mujer posmenopáusica u hombre ≥ 50).
 * - `t-score-assumed`: mujer ≥ 50 que aún no respondió la menopausia; OMS con nota precautoria.
 * - `incomplete-profile`: faltan datos; clasificación OMS preliminar con aviso.
 * - `z-score-required`: mujer premenopáusica o insegura, u hombre < 50; sin semáforo OMS.
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

/** Mujer que respondió "No estoy segura" o "Prefiero no decirlo": nunca se asume posmenopausia. */
export function isMenopauseUncertain({ sex, menopausalStatus }: BoneDensityPatient): boolean {
  return sex === "femenino" && menopausalStatus !== null && UNCERTAIN_STATUSES.has(menopausalStatus);
}

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
    if (menopausalStatus !== null && UNCERTAIN_STATUSES.has(menopausalStatus)) return "z-score-required";
    if (age === null) return "incomplete-profile";
    // Sin responder aún: desde los 50 se asume OMS; antes, Z-score (CLAUDE.md: "en menores").
    return age >= T_SCORE_ELIGIBILITY_MIN_AGE ? "t-score-assumed" : "z-score-required";
  }
  return "incomplete-profile";
}
