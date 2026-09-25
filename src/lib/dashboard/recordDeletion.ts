import {
  isWithinRestoreWindow,
  selectRestorableRecords,
  trashStore,
  type TrashedRecord,
} from "../storage/trash";
import { dexaVaultStore } from "./dexaVault";
import { painLogStore } from "./painLog";

export type RestoreResult = "restored" | "expired" | "not-found" | "conflict";

function byDate<T extends { date: string }>(a: T, b: T): number {
  return a.date.localeCompare(b.date);
}

/** Primero se guarda en la papelera y después se quita del store activo: nada se pierde a medias. */
function moveToTrash(item: TrashedRecord, now: Date): void {
  trashStore.write([...selectRestorableRecords(trashStore.getSnapshot(), now), item]);
}

export function softDeleteDexaScan(id: string, now: Date = new Date()): boolean {
  const scans = dexaVaultStore.getSnapshot();
  const scan = scans.find((entry) => entry.id === id);
  if (!scan) return false;

  moveToTrash(
    { id: `dexa-${scan.id}-${now.getTime()}`, kind: "dexa", deletedAt: now.toISOString(), record: scan },
    now
  );
  dexaVaultStore.write(scans.filter((entry) => entry.id !== id));
  return true;
}

export function softDeletePainLog(date: string, now: Date = new Date()): boolean {
  const entries = painLogStore.getSnapshot();
  const entry = entries.find((item) => item.date === date);
  if (!entry) return false;

  moveToTrash(
    { id: `pain-${date}-${now.getTime()}`, kind: "pain", deletedAt: now.toISOString(), record: entry },
    now
  );
  painLogStore.write(entries.filter((item) => item.date !== date));
  return true;
}

/** Devuelve el registro a su store si su fecha está libre. */
function restoreIntoActiveStore(item: TrashedRecord): boolean {
  if (item.kind === "dexa") {
    const scans = dexaVaultStore.getSnapshot();
    if (scans.some((scan) => scan.date === item.record.date)) return false;
    dexaVaultStore.write([...scans, item.record].sort(byDate));
    return true;
  }
  const entries = painLogStore.getSnapshot();
  if (entries.some((entry) => entry.date === item.record.date)) return false;
  painLogStore.write([...entries, item.record].sort(byDate));
  return true;
}

export function restoreTrashedRecord(trashId: string, now: Date = new Date()): RestoreResult {
  const trash = trashStore.getSnapshot();
  const item = trash.find((candidate) => candidate.id === trashId);
  if (!item) return "not-found";

  const remaining = trash.filter((candidate) => candidate.id !== trashId);
  if (!isWithinRestoreWindow(item, now)) {
    trashStore.write(remaining);
    return "expired";
  }

  const restored = restoreIntoActiveStore(item);
  // Con la fecha ocupada por un registro nuevo, el borrado queda reemplazado (igual que en la base).
  trashStore.write(remaining);
  return restored ? "restored" : "conflict";
}
