import { BOTTLE_SERVINGS, DOSE_SCHEDULE, RESTOCK_TRIGGER_DAY } from "../clinical/constants";
import type { DosePeriod, PillboxState } from "./types";

export interface BottleStatus {
  period: DosePeriod;
  label: string;
  servingsUsed: number;
  servingsRemaining: number;
  percentRemaining: number;
  needsRestock: boolean;
}

function countServingsUsed(state: PillboxState, doseId: string): number {
  return Object.values(state.takenDoseIdsByDate).filter((doseIds) =>
    doseIds.includes(doseId)
  ).length;
}

/**
 * Estima las tomas restantes de cada frasco usando el historial real de
 * tomas como proxy del consumo. La reposición se activa en el día
 * RESTOCK_TRIGGER_DAY de BOTTLE_SERVINGS (80% del frasco).
 */
export function buildBottleStatuses(state: PillboxState): BottleStatus[] {
  return DOSE_SCHEDULE.map((dose) => {
    const servingsUsed = countServingsUsed(state, dose.id);
    const servingsRemaining = Math.max(0, BOTTLE_SERVINGS - servingsUsed);
    return {
      period: dose.period,
      label: dose.label,
      servingsUsed,
      servingsRemaining,
      percentRemaining: Math.round((servingsRemaining / BOTTLE_SERVINGS) * 100),
      needsRestock: servingsUsed >= RESTOCK_TRIGGER_DAY,
    };
  });
}
