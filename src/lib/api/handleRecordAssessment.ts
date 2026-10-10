import { z } from "zod";
import { ARTICULAR_AGE_MAX, PATIENT_AGE_MAX, PATIENT_AGE_MIN } from "../clinical/constants";
import type { AssessmentRepository } from "../repositories/assessments";
import { RISK_LEVELS } from "../schemas/assessment";
import type { SyncRequester } from "./handleSyncBatch";
import { describeValidationError } from "./schemas";

/** Solo el resumen anónimo del test; un campo extra (p. ej. respuestas) se rechaza. */
export const recordAssessmentBodySchema = z
  .object({
    id: z.uuid(),
    chronologicalAge: z.number().int().min(PATIENT_AGE_MIN).max(PATIENT_AGE_MAX),
    articularAge: z.number().int().min(PATIENT_AGE_MIN).max(ARTICULAR_AGE_MAX),
    riskLevel: z.enum(RISK_LEVELS),
  })
  .strict();

export type RecordAssessmentResult =
  | { status: 201; data: { id: string } }
  | { status: 400 | 401 | 503; error: string };

interface RecordAssessmentRequest {
  repository: AssessmentRepository;
  requester: SyncRequester | null;
  body: unknown;
}

/** Guarda el resumen del Test de Edad Articular cuando ya hay sesión (C4). */
export async function handleRecordAssessment({
  repository,
  requester,
  body,
}: RecordAssessmentRequest): Promise<RecordAssessmentResult> {
  if (!requester) return { status: 401, error: "Se requiere una sesión para guardar la evaluación" };

  const parsed = recordAssessmentBodySchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, error: `Evaluación inválida (${describeValidationError(parsed.error)})` };
  }

  try {
    await repository.record(parsed.data);
  } catch (error) {
    console.error("[evaluaciones] No se pudo guardar", error instanceof Error ? error.message : "error desconocido");
    return { status: 503, error: "No se pudo guardar la evaluación por el momento" };
  }
  return { status: 201, data: { id: parsed.data.id } };
}
