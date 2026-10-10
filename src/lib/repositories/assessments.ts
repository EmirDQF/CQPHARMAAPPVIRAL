import { z } from "zod";
import type { RiskLevel } from "../types";
import { assessmentInsertSchema } from "../schemas/assessment";
import { upsertRows, type RepositoryClient } from "./supabaseRows";
import { RepositoryError } from "./types";

/**
 * Resumen del Test de Edad Articular. Solo edades y nivel de riesgo: la
 * política vigente dice que del test solo sale un resumen anónimo, así que
 * `answers` viaja vacío. El `id` lo crea el celular para que el reintento
 * de la outbox no duplique la evaluación.
 */
export interface AssessmentSummary {
  id: string;
  chronologicalAge: number;
  articularAge: number;
  riskLevel: RiskLevel;
}

/** `assessments` solo admite filas nuevas (INSERT y SELECT propios). */
export interface AssessmentRepository {
  record(assessment: AssessmentSummary): Promise<void>;
}

const TABLE = "assessments";
const assessmentRowSchema = assessmentInsertSchema.extend({ id: z.uuid() });

export function createSupabaseAssessmentRepository(client: RepositoryClient): AssessmentRepository {
  return {
    async record(assessment) {
      const parsed = assessmentRowSchema.safeParse({
        id: assessment.id,
        chronological_age: assessment.chronologicalAge,
        articular_age: assessment.articularAge,
        risk_level: assessment.riskLevel,
        answers: {},
      });
      if (!parsed.success) throw new RepositoryError(`validar ${TABLE}`);
      await upsertRows(client, TABLE, [parsed.data], { onConflict: "id", ignoreDuplicates: true });
    },
  };
}
