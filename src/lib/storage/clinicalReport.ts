import { isDoseComplete } from "../dashboard/pillbox";
import { stiffnessToMinutes } from "../dashboard/painLog";
import type { PainLogEntry, PillboxState } from "../dashboard/types";
import { lastNIsoDates, toLimaIsoDate } from "../utils/date";

const REPORT_WINDOW_DAYS = 30;
const MIN_DAYS_FOR_STIFFNESS_TREND = 14;
const STIFFNESS_COMPARISON_DAYS = 7;

export interface ClinicalReportSummary {
  averagePainLevel: number | null;
  stiffnessReductionPercent: number | null;
  adherencePercent: number;
  daysTracked: number;
}

function averageStiffnessMinutes(entries: PainLogEntry[]): number {
  if (entries.length === 0) return 0;
  const total = entries.reduce(
    (sum, entry) => sum + stiffnessToMinutes(entry.stiffness),
    0
  );
  return total / entries.length;
}

/** Solo los registros reales del paciente en los últimos 30 días de Lima, del más antiguo al más reciente. */
export function selectLast30DaysEntries(
  entries: PainLogEntry[],
  referenceDate: Date = new Date()
): PainLogEntry[] {
  const window = new Set(lastNIsoDates(REPORT_WINDOW_DAYS, referenceDate));
  return entries
    .filter((entry) => window.has(entry.date))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function calculateStiffnessReductionPercent(entries: PainLogEntry[]): number | null {
  if (entries.length < MIN_DAYS_FOR_STIFFNESS_TREND) return null;
  const before = averageStiffnessMinutes(entries.slice(0, STIFFNESS_COMPARISON_DAYS));
  const after = averageStiffnessMinutes(entries.slice(-STIFFNESS_COMPARISON_DAYS));
  if (before <= 0) return null;
  return Math.round(((before - after) / before) * 100);
}

export function buildClinicalReportSummary(
  painEntries: PainLogEntry[],
  pillboxState: PillboxState,
  referenceDate: Date = new Date()
): ClinicalReportSummary {
  const entries = selectLast30DaysEntries(painEntries, referenceDate);

  const averagePainLevel =
    entries.length > 0
      ? Math.round(
          (entries.reduce((sum, entry) => sum + entry.painLevel, 0) / entries.length) * 10
        ) / 10
      : null;

  const trackedDates = lastNIsoDates(REPORT_WINDOW_DAYS, referenceDate);
  const completeDoseDays = trackedDates.filter((date) =>
    isDoseComplete(pillboxState, date)
  ).length;

  return {
    averagePainLevel,
    stiffnessReductionPercent: calculateStiffnessReductionPercent(entries),
    adherencePercent: Math.round((completeDoseDays / trackedDates.length) * 100),
    daysTracked: entries.length,
  };
}

/** Describe la variación de rigidez con dirección explícita (positivo = disminuyó). */
export function describeStiffnessChange(reductionPercent: number): string {
  if (reductionPercent > 0) return `disminuyó ${reductionPercent}%`;
  if (reductionPercent < 0) return `aumentó ${Math.abs(reductionPercent)}%`;
  return "se mantuvo sin cambios";
}

export interface ClinicalReportBoneScan {
  worstTScore: number;
  diagnosisLabel: string;
  scanDate: string;
}

export function formatClinicalReportText(
  summary: ClinicalReportSummary,
  boneScan: ClinicalReportBoneScan | null = null,
  hasFractureHistory = false
): string {
  const lines = [
    "📋 Informe Artikare — Seguimiento Clínico",
    boneScan
      ? `Densitometría: Peor T-score ${boneScan.worstTScore.toFixed(1)} (${boneScan.diagnosisLabel}) · ${boneScan.scanDate}`
      : "Densitometría: Sin densitometría registrada",
    `Antecedente de fractura: ${hasFractureHistory ? "Sí" : "No"}`,
    summary.averagePainLevel !== null
      ? `Dolor promedio (${summary.daysTracked} días registrados): ${summary.averagePainLevel}/10`
      : "Dolor promedio: Sin registros de dolor en los últimos 30 días",
    summary.stiffnessReductionPercent !== null
      ? `Rigidez matutina reportada: ${describeStiffnessChange(summary.stiffnessReductionPercent)}`
      : "Rigidez matutina reportada: datos insuficientes aún",
    `Adherencia a suplementación (30 días): ${summary.adherencePercent}%`,
    `Generado el ${toLimaIsoDate()} para compartir con tu médico reumatólogo.`,
  ];
  return lines.join("\n");
}
