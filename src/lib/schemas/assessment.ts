import { z } from "zod";
import { ARTICULAR_AGE_MAX, PATIENT_AGE_MAX, PATIENT_AGE_MIN } from "../clinical/constants";
import type { RiskLevel } from "../types";
import { ownedRowColumns } from "./shared";

export const RISK_LEVELS = ["bajo", "moderado", "alto"] as const satisfies readonly RiskLevel[];

/**
 * Claves y valores son identificadores ASCII (`nutricionMineral`, `a_veces`):
 * así 20 respuestas de 64 caracteres siempre caben en el CHECK
 * `pg_column_size(answers) <= 4096` (texto multibyte podría superarlo).
 */
const ANSWER_TOKEN_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_ANSWERS = 20;
const answerTokenSchema = z.string().regex(ANSWER_TOKEN_PATTERN);

/** Resultado del Test de Edad Articular (orientativo, nunca diagnóstico). */
export const assessmentInsertSchema = z.object({
  chronological_age: z.number().int().min(PATIENT_AGE_MIN).max(PATIENT_AGE_MAX),
  articular_age: z.number().int().min(PATIENT_AGE_MIN).max(ARTICULAR_AGE_MAX),
  risk_level: z.enum(RISK_LEVELS),
  answers: z
    .record(answerTokenSchema, answerTokenSchema)
    .refine((answers) => Object.keys(answers).length <= MAX_ANSWERS),
});

export const assessmentRowSchema = assessmentInsertSchema.extend(ownedRowColumns);

export type AssessmentInsert = z.infer<typeof assessmentInsertSchema>;
export type AssessmentRow = z.infer<typeof assessmentRowSchema>;
