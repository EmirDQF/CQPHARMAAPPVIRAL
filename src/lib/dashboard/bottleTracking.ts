import { BOTTLE_SERVINGS, DOSE_SCHEDULE, RESTOCK_TRIGGER_DAY } from "../clinical/constants";
import { currentBottleStart, EMPTY_BOTTLES_STATE, type BottlesState } from "./bottles";
import type { DosePeriod, PillboxState } from "./types";

export interface BottleStatus {
  period: DosePeriod;
  productId: string;
  label: string;
  servingsUsed: number;
  servingsRemaining: number;
  percentRemaining: number;
  needsRestock: boolean;
}

function countServingsUsed(state: PillboxState, doseId: string, since: string | null): number {
  return Object.entries(state.takenDoseIdsByDate).filter(
    ([date, doseIds]) => (since === null || date >= since) && doseIds.includes(doseId)
  ).length;
}

/**
 * Estima las tomas restantes de cada frasco usando el historial real de
 * tomas como proxy del consumo. Si el paciente marcó "Ya repuse mi frasco",
 * solo cuentan las tomas desde ese día; si nunca lo marcó, cuentan todas
 * (así nadie pierde su aviso). La reposición se activa en el día
 * RESTOCK_TRIGGER_DAY de BOTTLE_SERVINGS (80% del frasco).
 */
export function buildBottleStatuses(
  state: PillboxState,
  bottles: BottlesState = EMPTY_BOTTLES_STATE
): BottleStatus[] {
  return DOSE_SCHEDULE.map((dose) => {
    const since = currentBottleStart(bottles, dose.productId);
    const servingsUsed = countServingsUsed(state, dose.id, since);
    const servingsRemaining = Math.max(0, BOTTLE_SERVINGS - servingsUsed);
    return {
      period: dose.period,
      productId: dose.productId,
      label: dose.label,
      servingsUsed,
      servingsRemaining,
      percentRemaining: Math.round((servingsRemaining / BOTTLE_SERVINGS) * 100),
      needsRestock: servingsUsed >= RESTOCK_TRIGGER_DAY,
    };
  });
}
