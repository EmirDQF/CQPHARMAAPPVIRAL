import {
  CONTROL_MONTHS_DEFAULT,
  CONTROL_MONTHS_OSTEOPOROSIS,
  WHO_T_SCORE_NORMAL_MIN,
  WHO_T_SCORE_OSTEOPOROSIS_MAX,
} from "../clinical/constants";
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

/** Clasificación OMS: Normal T ≥ -1.0 · Osteopenia -2.5 < T < -1.0 · Osteoporosis T ≤ -2.5. */
export function classifyTScore(tScore: number): RiskLevel {
  if (tScore >= WHO_T_SCORE_NORMAL_MIN) return "bajo";
  if (tScore > WHO_T_SCORE_OSTEOPOROSIS_MAX) return "moderado";
  return "alto";
}

const DIAGNOSIS_LABEL: Record<RiskLevel, string> = {
  bajo: "Densidad Ósea Normal",
  moderado: "Osteopenia",
  alto: "Osteoporosis",
};

const DIAGNOSIS_MESSAGE: Record<RiskLevel, string> = {
  bajo: "Tu densidad ósea está en rango normal. Mantén tu protocolo preventivo y actividad de fuerza.",
  moderado:
    "Tu médico definirá el tratamiento. El Citrato de Magnesio + D3 puede complementar tu tratamiento y apoyar tu salud ósea.",
  alto: "Requiere seguimiento reumatológico. Consulta con tu reumatólogo antes de iniciar o cambiar cualquier suplemento.",
};

function worstTScoreOf(entry: DexaScanEntry): number {
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
 * femoral). Devuelve null si el paciente no registró ningún estudio: nunca
 * se muestra un T-score que el paciente no haya cargado.
 */
export function buildBoneScanSummaryFromEntries(
  entries: DexaScanEntry[]
): BoneScanSummary | null {
  if (entries.length === 0) return null;

  const latest = entries[entries.length - 1];
  const worst = worstTScoreOf(latest);
  const riskLevel = classifyTScore(worst);

  return {
    scanDate: latest.date,
    worstTScore: worst,
    riskLevel,
    diagnosisLabel: DIAGNOSIS_LABEL[riskLevel],
    diagnosisMessage: DIAGNOSIS_MESSAGE[riskLevel],
    nextControlMonths:
      riskLevel === "alto" ? CONTROL_MONTHS_OSTEOPOROSIS : CONTROL_MONTHS_DEFAULT,
  };
}

export const dexaVaultStore = store;
