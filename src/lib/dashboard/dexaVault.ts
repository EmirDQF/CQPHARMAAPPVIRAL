import { createPersistentStore } from "../storage/persistentStore";
import type { RiskLevel } from "../types";
import type { BoneScanSummary } from "./types";

export interface DexaScanEntry {
  id: string;
  date: string;
  lumbarTScore: number;
  femoralNeckTScore: number;
  radiologyCenter: string;
}

const store = createPersistentStore<DexaScanEntry[]>("artikare_dexa_vault_v1", []);

export function classifyTScore(tScore: number): RiskLevel {
  if (tScore >= -1.0) return "bajo";
  if (tScore >= -2.5) return "moderado";
  return "alto";
}

const DIAGNOSIS_LABEL: Record<RiskLevel, string> = {
  bajo: "Densidad Ósea Normal",
  moderado: "Osteopenia",
  alto: "Osteoporosis",
};

const DIAGNOSIS_MESSAGE: Record<RiskLevel, string> = {
  bajo: "Tu densidad ósea está en rango normal. Mantén tu protocolo preventivo y actividad de fuerza.",
  moderado: "Estás a tiempo de revertir la pérdida ósea con tu protocolo de Citrato de Magnesio + D3.",
  alto: "Requiere seguimiento reumatológico estricto y adherencia estricta a tu tratamiento.",
};

function worstTScore(entry: DexaScanEntry): number {
  return Math.min(entry.lumbarTScore, entry.femoralNeckTScore);
}

export function addDexaScanEntry(entry: Omit<DexaScanEntry, "id">): void {
  const id = `dexa-${Date.now()}`;
  const updated = [...store.getSnapshot(), { ...entry, id }].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  store.write(updated);
}

/**
 * Deriva el resumen del semáforo óseo a partir del estudio DEXA más
 * reciente, usando siempre el peor de los dos T-Score (lumbar / cuello
 * femoral) para la recomendación reumatológica, tal como indica el blueprint.
 */
export function buildBoneScanSummaryFromEntries(
  entries: DexaScanEntry[]
): BoneScanSummary | null {
  if (entries.length === 0) return null;

  const latest = entries[entries.length - 1];
  const worst = worstTScore(latest);
  const riskLevel = classifyTScore(worst);

  return {
    scanDate: latest.date,
    tScoreHip: worst,
    riskLevel,
    diagnosisLabel: DIAGNOSIS_LABEL[riskLevel],
    diagnosisMessage: DIAGNOSIS_MESSAGE[riskLevel],
    nextControlMonths: riskLevel === "alto" ? 6 : 12,
  };
}

export const dexaVaultStore = store;
