import { z } from "zod";
import { ARTICULAR_AGE_MAX, PATIENT_AGE_MAX, PATIENT_AGE_MIN } from "../clinical/constants";
import type { RiskLevel } from "../types";
import { ownedRowColumns } from "./shared";

export const RISK_LEVELS = ["bajo", "moderado", "alto"] as const satisfies readonly RiskLevel[];

const ANSWER_TEXT_MAX = 64;
const MAX_ANSWERS = 20;

/** Resultado del Test de Edad Articular (orientativo, nunca diagnóstico). */
export const assessmentInsertSchema = z.object({
  chronological_age: z.number().int().min(PATIENT_AGE_MIN).max(PATIENT_AGE_MAX),
  articular_age: z.number().int().min(PATIENT_AGE_MIN).max(ARTICULAR_AGE_MAX),
  risk_level: z.enum(RISK_LEVELS),
  answers: z
    .record(z.string().max(ANSWER_TEXT_MAX), z.string().max(ANSWER_TEXT_MAX))
    .refine((answers) => Object.keys(answers).length <= MAX_ANSWERS),
});

export const assessmentRowSchema = assessmentInsertSchema.extend(ownedRowColumns);

export type AssessmentInsert = z.infer<typeof assessmentInsertSchema>;
export type AssessmentRow = z.infer<typeof assessmentRowSchema>;
