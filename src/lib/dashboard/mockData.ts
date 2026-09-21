import type { BoneScanSummary, DoseSchedule, PainLogEntry, StiffnessBucket } from "./types";

export const doseSchedule: DoseSchedule[] = [
  {
    id: "morning-collagen",
    time: "08:30 AM",
    label: "Colágeno Hidrolizado + Vitamina C",
    period: "morning",
  },
  {
    id: "night-magnesium",
    time: "09:30 PM",
    label: "Citrato de Magnesio + D3",
    period: "night",
  },
];

export const latestBoneScan: BoneScanSummary = {
  scanDate: "2026-08-15",
  tScoreHip: -1.6,
  riskLevel: "moderado",
  diagnosisLabel: "Osteopenia Moderada",
  diagnosisMessage:
    "Estás a tiempo de revertir la pérdida ósea con tu protocolo de Citrato de Magnesio + D3.",
  nextControlMonths: 12,
};

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Genera 30 días de historial simulado con tendencia de mejora, para que el
 * dashboard tenga datos representativos antes de que el paciente registre
 * sus propios check-ins diarios.
 */
export function buildSeedPainLog(referenceDate: Date = new Date()): PainLogEntry[] {
  const stiffnessSequence: StiffnessBucket[] = ["30+", "15-30", "0-15"];
  const entries: PainLogEntry[] = [];

  for (let daysAgo = 29; daysAgo >= 0; daysAgo -= 1) {
    const date = new Date(referenceDate);
    date.setDate(date.getDate() - daysAgo);

    const progress = (29 - daysAgo) / 29; // 0 al inicio, 1 hoy
    const painLevel = Math.round(7 - progress * 4 + Math.sin(daysAgo) * 0.5);
    const stiffnessIndex = Math.min(
      stiffnessSequence.length - 1,
      Math.floor(progress * stiffnessSequence.length)
    );

    entries.push({
      date: toIsoDate(date),
      painLevel: Math.min(10, Math.max(1, painLevel)),
      stiffness: stiffnessSequence[stiffnessIndex],
    });
  }

  return entries;
}

/**
 * Combina los registros reales del paciente (localStorage) con la
 * simulación histórica, priorizando siempre el dato real cuando ambos
 * existen para la misma fecha. Así el gráfico de tendencia nunca aparece
 * vacío en la primera visita, pero refleja la toma real en cuanto existe.
 */
export function mergePainLogWithSeed(realEntries: PainLogEntry[]): PainLogEntry[] {
  const seed = buildSeedPainLog();
  const realDates = new Set(realEntries.map((entry) => entry.date));
  const seedWithoutOverrides = seed.filter((entry) => !realDates.has(entry.date));

  return [...seedWithoutOverrides, ...realEntries].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}
