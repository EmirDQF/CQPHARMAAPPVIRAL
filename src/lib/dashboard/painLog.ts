import { createPersistentStore } from "../storage/persistentStore";
import type { PainLogEntry } from "./types";

const store = createPersistentStore<PainLogEntry[]>("artikare_pain_log_v1", []);

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function saveTodayPainLogEntry(entry: Omit<PainLogEntry, "date">): void {
  const current = store.getSnapshot();
  const date = todayIsoDate();
  const updated = [
    ...current.filter((item) => item.date !== date),
    { ...entry, date },
  ].sort((a, b) => a.date.localeCompare(b.date));

  store.write(updated);
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

export const painLogStore = store;
