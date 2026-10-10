import { z } from "zod";
import type { AssessmentSummary } from "../repositories/assessments";
import { RISK_LEVELS } from "../schemas/assessment";
import { createPersistentStore } from "../storage/persistentStore";
import type { RiskResult } from "../types";
import { enqueueOutboxRequest, flushOutbox } from "./outbox";

/**
 * Último resultado del Test de Edad Articular a la espera de una sesión (C4).
 * El test no crea sesión: el resumen se sube cuando ya existe una (al agendar
 * una cita o con cuenta). Solo edades y nivel de riesgo, como dice la política.
 */
export interface PendingAssessmentState {
  assessment: AssessmentSummary | null;
}

const stateSchema = z.object({
  assessment: z
    .object({
      id: z.uuid(),
      chronologicalAge: z.number().int(),
      articularAge: z.number().int(),
      riskLevel: z.enum(RISK_LEVELS),
    })
    .nullable(),
});

export const pendingAssessmentStore = createPersistentStore<PendingAssessmentState>(
  "artikare_pending_assessment_v1",
  { assessment: null },
  (raw) => {
    const result = stateSchema.safeParse(raw);
    return result.success ? result.data : null;
  }
);

export function savePendingAssessment(result: Pick<RiskResult, "chronologicalAge" | "articularAge" | "riskLevel">): void {
  pendingAssessmentStore.write({
    assessment: {
      id: crypto.randomUUID(),
      chronologicalAge: result.chronologicalAge,
      articularAge: result.articularAge,
      riskLevel: result.riskLevel,
    },
  });
}

/** Encola la evaluación pendiente (la outbox la guarda hasta entregarla). true si encoló. */
export function uploadPendingAssessment(): boolean {
  const { assessment } = pendingAssessmentStore.getSnapshot();
  if (!assessment) return false;

  const queued = enqueueOutboxRequest("/api/assessments", { ...assessment }, { containsPersonalData: false });
  if (!queued) return false;
  pendingAssessmentStore.write({ assessment: null });
  void flushOutbox();
  return true;
}
