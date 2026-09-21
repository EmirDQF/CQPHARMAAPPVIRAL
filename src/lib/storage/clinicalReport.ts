import { doseSchedule, mergePainLogWithSeed } from "../dashboard/mockData";
import { stiffnessToMinutes } from "../dashboard/painLog";
import type { PainLogEntry, PillboxState } from "../dashboard/types";

export interface ClinicalReportSummary {
  averagePainLevel: number;
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

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function last30DayDates(): string[] {
  const dates: string[] = [];
  const cursor = new Date();
  for (let i = 0; i < 30; i += 1) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() - 1);
  }
  return dates;
}

export function buildClinicalReportSummary(
  realPainEntries: PainLogEntry[],
  pillboxState: PillboxState
): ClinicalReportSummary {
  const entries = mergePainLogWithSeed(realPainEntries);

  const averagePainLevel =
    entries.length > 0
      ? entries.reduce((sum, entry) => sum + entry.painLevel, 0) / entries.length
      : 0;

  let stiffnessReductionPercent: number | null = null;
  if (entries.length >= 14) {
    const before = averageStiffnessMinutes(entries.slice(0, 7));
    const after = averageStiffnessMinutes(entries.slice(-7));
    if (before > 0) {
      stiffnessReductionPercent = Math.round(((before - after) / before) * 100);
    }
  }

  const trackedDates = last30DayDates();
  const completeDoseDays = trackedDates.filter((date) => {
    const taken = new Set(pillboxState.takenDoseIdsByDate[date] ?? []);
    return doseSchedule.every((dose) => taken.has(dose.id));
  }).length;
  const adherencePercent = Math.round(
    (completeDoseDays / trackedDates.length) * 100
  );

  return {
    averagePainLevel: Math.round(averagePainLevel * 10) / 10,
    stiffnessReductionPercent,
    adherencePercent,
    daysTracked: entries.length,
  };
}

export function formatClinicalReportText(summary: ClinicalReportSummary): string {
  const lines = [
    "📋 Informe Artikare — Seguimiento Clínico",
    `Dolor promedio (${summary.daysTracked} días): ${summary.averagePainLevel}/10`,
    summary.stiffnessReductionPercent !== null
      ? `Reducción de rigidez matutina: ${summary.stiffnessReductionPercent}%`
      : "Reducción de rigidez matutina: datos insuficientes aún",
    `Adherencia a suplementación (30 días): ${summary.adherencePercent}%`,
    `Generado el ${todayIsoDate()} para compartir con tu médico reumatólogo.`,
  ];
  return lines.join("\n");
}
