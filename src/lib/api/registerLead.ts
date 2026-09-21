import type { RiskResult } from "../types";

/**
 * Envío best-effort al backend para analítica clínica del test viral. No
 * bloquea ni afecta la tarjeta de resultado que ya ve el usuario si falla.
 */
export function registerLeadForAnalytics(result: RiskResult, phone?: string): void {
  fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chronologicalAge: result.chronologicalAge,
      articularAge: result.articularAge,
      riskLevel: result.riskLevel,
      phone: phone ?? null,
    }),
  }).catch(() => {});
}
