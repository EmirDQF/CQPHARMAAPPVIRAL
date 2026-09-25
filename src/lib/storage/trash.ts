import { SOFT_DELETE_RESTORE_DAYS } from "../clinical/constants";
import type { DexaScanEntry } from "../dashboard/dexaVault";
import type { PainLogEntry } from "../dashboard/types";
import { createPersistentStore } from "./persistentStore";

/**
 * Papelera local (modo invitado): los registros borrados salen de sus stores
 * activos —así ninguna pantalla, bandera roja ni reporte los ve— y quedan aquí
 * 30 días para deshacer. Equivale a `deleted_at` + RLS en Supabase.
 */
export type TrashedRecord =
  | { id: string; kind: "dexa"; deletedAt: string; record: DexaScanEntry }
  | { id: string; kind: "pain"; deletedAt: string; record: PainLogEntry };

export type TrashedRecordKind = TrashedRecord["kind"];

const DAY_MS = 24 * 60 * 60 * 1000;
const RESTORE_WINDOW_MS = SOFT_DELETE_RESTORE_DAYS * DAY_MS;

function isTrashedRecord(value: unknown): value is TrashedRecord {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  const record = item.record as Record<string, unknown> | null | undefined;
  return (
    (item.kind === "dexa" || item.kind === "pain") &&
    typeof item.id === "string" &&
    typeof item.deletedAt === "string" &&
    Number.isFinite(Date.parse(item.deletedAt)) &&
    typeof record === "object" &&
    record !== null &&
    typeof record.date === "string"
  );
}

/** Descarta entradas corruptas sin perder las válidas. */
export function parseStoredTrash(raw: unknown): TrashedRecord[] | null {
  return Array.isArray(raw) ? raw.filter(isTrashedRecord) : null;
}

export const trashStore = createPersistentStore<TrashedRecord[]>(
  "artikare_trash_v1",
  [],
  parseStoredTrash
);

/** Mismo criterio que la base: se puede deshacer si se borró hace menos de 30 días. */
export function isWithinRestoreWindow(item: TrashedRecord, now: Date): boolean {
  return now.getTime() - Date.parse(item.deletedAt) < RESTORE_WINDOW_MS;
}

export function restoreDeadline(item: TrashedRecord): Date {
  return new Date(Date.parse(item.deletedAt) + RESTORE_WINDOW_MS);
}

/** Lo que aún se puede deshacer, del más reciente al más antiguo. */
export function selectRestorableRecords(
  trash: readonly TrashedRecord[],
  now: Date
): TrashedRecord[] {
  return trash
    .filter((item) => isWithinRestoreWindow(item, now))
    .sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
}

/** Un registro nuevo en la misma fecha reemplaza al borrado (igual que la base). */
export function discardTrashedRecordsFor(kind: TrashedRecordKind, date: string): void {
  const current = trashStore.getSnapshot();
  const remaining = current.filter((item) => !(item.kind === kind && item.record.date === date));
  if (remaining.length !== current.length) trashStore.write(remaining);
}
