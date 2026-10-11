import { z } from "zod";
import { createPersistentStore } from "../storage/persistentStore";
import type { SyncDomainName } from "./domains";

/**
 * Base de la fusión a tres vías: huella de cada registro tal como quedó
 * confirmada en el celular y en la cuenta. Es de UNA cuenta: si en el
 * celular entra otra, se empieza sin base y no se infiere ningún borrado.
 * Solo guarda huellas de identidad (fecha, valores), igual que los stores locales.
 */
export type SyncBases = Partial<Record<SyncDomainName, Record<string, string>>>;

export interface SyncState {
  userId: string | null;
  bases: SyncBases;
}

const syncStateSchema = z.object({
  userId: z.string().nullable(),
  bases: z.record(z.string(), z.record(z.string(), z.string())),
});

function parseSyncState(raw: unknown): SyncState | null {
  const result = syncStateSchema.safeParse(raw);
  return result.success ? { userId: result.data.userId, bases: result.data.bases as SyncBases } : null;
}

export const syncStateStore = createPersistentStore<SyncState>(
  "artikare_sync_state_v1",
  { userId: null, bases: {} },
  parseSyncState
);

export function readBasesFor(userId: string): SyncBases {
  const state = syncStateStore.getSnapshot();
  return state.userId === userId ? state.bases : {};
}

export function saveBasesFor(userId: string, bases: SyncBases): void {
  syncStateStore.write({ userId, bases });
}
