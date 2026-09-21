import { doseSchedule } from "./mockData";
import type { DosePeriod, PillboxState } from "./types";

export const BOTTLE_SUPPLY_DAYS = 60;
export const RESTOCK_TRIGGER_DAYS = 50;

export interface BottleStatus {
  period: DosePeriod;
  label: string;
  daysUsed: number;
  daysRemaining: number;
  percentRemaining: number;
  needsRestock: boolean;
}

function countDaysUsedForPeriod(state: PillboxState, doseId: string): number {
  return Object.values(state.takenDoseIdsByDate).filter((doseIds) =>
    doseIds.includes(doseId)
  ).length;
}

/**
 * Estima los días de frasco restantes por período de dosis, usando el
 * historial real de tomas como proxy del consumo (un frasco dura
 * BOTTLE_SUPPLY_DAYS tomas), tal como indica el blueprint de re-stock
 * predictivo al 80% de duración del frasco.
 */
export function buildBottleStatuses(state: PillboxState): BottleStatus[] {
  return doseSchedule.map((dose) => {
    const daysUsed = countDaysUsedForPeriod(state, dose.id);
    const daysRemaining = Math.max(0, BOTTLE_SUPPLY_DAYS - daysUsed);
    return {
      period: dose.period,
      label: dose.label,
      daysUsed,
      daysRemaining,
      percentRemaining: Math.round((daysRemaining / BOTTLE_SUPPLY_DAYS) * 100),
      needsRestock: daysUsed >= RESTOCK_TRIGGER_DAYS,
    };
  });
}
