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

export interface BoneScanSummary {
  scanDate: string;
  worstTScore: number;
  riskLevel: RiskLevel;
  diagnosisLabel: string;
  diagnosisMessage: string;
  nextControlMonths: number;
}

export interface PillboxState {
  takenDoseIdsByDate: Record<string, string[]>;
}
