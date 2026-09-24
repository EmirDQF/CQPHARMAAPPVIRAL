import type { RiskResult } from "../types";
import { enqueueOutboxRequest, flushOutbox } from "./outbox";

/**
 * Registra el resultado anónimo del test (edades + nivel de riesgo, sin
 * datos de contacto) para analítica clínica. Pasa por el outbox para que un
 * fallo de red no lo pierda ni bloquee la tarjeta de resultado.
 */
export function registerLeadForAnalytics(result: RiskResult): void {
  const queued = enqueueOutboxRequest(
    "/api/leads",
    {
      chronologicalAge: result.chronologicalAge,
      articularAge: result.articularAge,
      riskLevel: result.riskLevel,
    },
    { containsPersonalData: false }
  );
  if (queued) void flushOutbox();
}
