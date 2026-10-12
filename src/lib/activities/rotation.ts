import type { Activity } from "./schemas";

/**
 * Misiones del día: los registros básicos (chequeo y tomas) siempre, más una
 * selección del resto que rota cada día de Lima de forma determinista (mismo
 * día = misma lista, en cualquier celular). Con bandera roja no aparece ninguna
 * actividad física; las que piden visto bueno médico nunca aparecen.
 */
const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const UINT32_RANGE = 0x100000000;
const MULBERRY_INCREMENT = 0x6d2b79f5;

/** FNV-1a de 32 bits de la fecha YYYY-MM-DD. */
export function hashIsoDate(isoDate: string): number {
  return [...isoDate].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), FNV_PRIME) >>> 0, FNV_OFFSET);
}

/** PRNG mulberry32: reproducible a partir de la semilla. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + MULBERRY_INCREMENT) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / UINT32_RANGE;
  };
}

function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const random = seededRandom(seed);
  return items
    .map((item) => ({ item, key: random() }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item);
}

/** Primero una actividad de cada categoría (variedad), luego el resto en el mismo orden. */
function preferVariety(shuffled: readonly Activity[]): Activity[] {
  const seen = new Set<string>();
  const firstOfEach = shuffled.filter((activity) => {
    if (seen.has(activity.category)) return false;
    seen.add(activity.category);
    return true;
  });
  return [...firstOfEach, ...shuffled.filter((activity) => !firstOfEach.includes(activity))];
}

export interface DailyMissionInput {
  catalog: readonly Activity[];
  date: string;
  goal: number;
  hasRedFlag: boolean;
}

export function isActivityAllowed(activity: Activity, hasRedFlag: boolean): boolean {
  if (activity.requiresClearance) return false;
  return !(hasRedFlag && activity.safety === "physical");
}

export function selectDailyMissions({ catalog, date, goal, hasRedFlag }: DailyMissionInput): Activity[] {
  const allowed = catalog.filter((activity) => isActivityAllowed(activity, hasRedFlag));
  const core = allowed.filter((activity) => activity.core);
  const pool = preferVariety(seededShuffle(allowed.filter((activity) => !activity.core), hashIsoDate(date)));
  return [...core, ...pool].slice(0, Math.max(goal, core.length));
}
