import type { BoneDensityInterpretation } from "../clinical/tScoreEligibility";
import type { RiskLevel } from "../types";

export type StiffnessBucket = "0-15" | "15-30" | "30+";

export interface PainLogEntry {
  date: string;
  painLevel: number;
  stiffness: StiffnessBucket;
}

export type DosePeriod = "morning" | "night";

export interface DoseSchedule {
  id: string;
  time: string;
  label: string;
  period: DosePeriod;
}

interface BoneScanSummaryBase {
  scanDate: string;
  worstTScore: number;
  diagnosisLabel: string;
  diagnosisMessage: string;
  nextControlMonths: number;
}

/**
 * Sin T-score aplicable (`z-score-required`) no existe `riskLevel`: ninguna
 * pantalla puede pintar el semáforo OMS ni la etiqueta de osteoporosis.
 */
export type BoneScanSummary =
  | (BoneScanSummaryBase & {
      interpretation: Exclude<BoneDensityInterpretation, "z-score-required">;
      riskLevel: RiskLevel;
      /** Aviso para clasificaciones preliminares o asumidas. */
      profileNote: string | null;
    })
  | (BoneScanSummaryBase & {
      interpretation: "z-score-required";
      riskLevel: null;
      profileNote: null;
    });

export interface PillboxState {
  takenDoseIdsByDate: Record<string, string[]>;
}
