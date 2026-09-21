import { createListenerSet } from "../createListenerSet";
import { doseSchedule } from "./mockData";
import type { PillboxState } from "./types";

const STORAGE_KEY = "artikare_pillbox_v1";
const { subscribe, notify } = createListenerSet();
const EMPTY_STATE: PillboxState = { takenDoseIdsByDate: {} };

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function readFromStorage(): PillboxState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PillboxState) : EMPTY_STATE;
  } catch {
    return EMPTY_STATE;
  }
}

let cachedSnapshot: PillboxState | null = null;

function getSnapshot(): PillboxState {
  if (!cachedSnapshot) cachedSnapshot = readFromStorage();
  return cachedSnapshot;
}

function getServerSnapshot(): PillboxState {
  return EMPTY_STATE;
}

export function markDoseTaken(doseId: string): void {
  const current = readFromStorage();
  const date = todayIsoDate();
  const takenToday = current.takenDoseIdsByDate[date] ?? [];
  if (takenToday.includes(doseId)) return;

  const updated: PillboxState = {
    takenDoseIdsByDate: {
      ...current.takenDoseIdsByDate,
      [date]: [...takenToday, doseId],
    },
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Sin almacenamiento persistente disponible; la toma queda registrada
    // solo para la sesión actual.
  }

  cachedSnapshot = updated;
  notify();
}

function isDoseComplete(state: PillboxState, date: string): boolean {
  const taken = new Set(state.takenDoseIdsByDate[date] ?? []);
  return doseSchedule.every((dose) => taken.has(dose.id));
}

/**
 * Cuenta días consecutivos (terminando hoy) en los que se tomaron todas
 * las dosis programadas. Se deriva del historial en vez de guardarse como
 * contador aparte, para que nunca se desincronice de los datos reales.
 */
export function calculateStreakDays(
  state: PillboxState,
  referenceDate: Date = new Date()
): number {
  let streak = 0;
  const cursor = new Date(referenceDate);

  while (isDoseComplete(state, cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export const pillboxStore = { subscribe, getSnapshot, getServerSnapshot };
