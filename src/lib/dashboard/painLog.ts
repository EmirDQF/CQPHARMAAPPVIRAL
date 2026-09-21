import { createListenerSet } from "../createListenerSet";
import type { PainLogEntry } from "./types";

const STORAGE_KEY = "artikare_pain_log_v1";
const { subscribe, notify } = createListenerSet();
const EMPTY_ENTRIES: PainLogEntry[] = [];

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function readFromStorage(): PainLogEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PainLogEntry[]) : [];
  } catch {
    return [];
  }
}

let cachedSnapshot: PainLogEntry[] | null = null;

function getSnapshot(): PainLogEntry[] {
  if (!cachedSnapshot) cachedSnapshot = readFromStorage();
  return cachedSnapshot;
}

function getServerSnapshot(): PainLogEntry[] {
  return EMPTY_ENTRIES;
}

export function saveTodayPainLogEntry(entry: Omit<PainLogEntry, "date">): void {
  const current = readFromStorage();
  const date = todayIsoDate();
  const updated = [
    ...current.filter((item) => item.date !== date),
    { ...entry, date },
  ].sort((a, b) => a.date.localeCompare(b.date));

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Sin almacenamiento persistente disponible (modo privado, cuota
    // excedida, etc.): el check-in sigue funcionando en memoria.
  }

  cachedSnapshot = updated;
  notify();
}

export function stiffnessToMinutes(stiffness: PainLogEntry["stiffness"]): number {
  switch (stiffness) {
    case "0-15":
      return 7.5;
    case "15-30":
      return 22.5;
    case "30+":
      return 35;
    default:
      return 0;
  }
}

export const painLogStore = { subscribe, getSnapshot, getServerSnapshot };
