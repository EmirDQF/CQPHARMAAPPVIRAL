import { z } from "zod";
import { ARTIKO_ACCESSORIES, type ArtikoAccessory } from "../mascot/mascot";
import { createPersistentStore } from "../storage/persistentStore";
import { toLimaIsoDate } from "../utils/date";

/**
 * Progreso del juego (`artikare_game_v1`): solo en el celular, sin datos
 * clínicos. Las tomas y el chequeo NO se guardan aquí: se leen del pastillero
 * y del diario (una sola fuente de verdad). Aquí van las demás actividades,
 * los desbloqueos y los accesorios puestos. Queda fuera de la sincronización
 * con la cuenta hasta que exista su tabla con RLS (docs/BLOCKERS.md).
 */
export const GAME_PROGRESS_VERSION = 1;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ACTIVITY_ID = /^[a-z0-9-]{3,40}$/;

const unlockedSchema = z.object({ key: z.string().min(1), unlockId: z.string().min(1), on: z.string().regex(ISO_DATE) });
export type UnlockedItem = z.infer<typeof unlockedSchema>;

const gameProgressSchema = z.object({
  version: z.literal(GAME_PROGRESS_VERSION),
  completions: z.record(z.string().regex(ISO_DATE), z.array(z.string().regex(ACTIVITY_ID))).catch({}),
  unlocked: z.array(unlockedSchema).catch([]),
  celebratedKeys: z.array(z.string()).catch([]),
  equipped: z.array(z.enum(ARTIKO_ACCESSORIES)).catch([]),
  /** Último día de Lima en que se abrió /app (bienvenida de retorno, pausa de avisos). */
  lastOpenedOn: z.string().regex(ISO_DATE).nullable().catch(null),
});
export type GameProgress = z.infer<typeof gameProgressSchema>;

export const EMPTY_GAME_PROGRESS: GameProgress = {
  version: GAME_PROGRESS_VERSION,
  completions: {},
  unlocked: [],
  celebratedKeys: [],
  equipped: [],
  lastOpenedOn: null,
};

/** null = versión desconocida: el store la conserva sin sobrescribirla. */
export function parseGameProgress(raw: unknown): GameProgress | null {
  const parsed = gameProgressSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export const gameProgressStore = createPersistentStore<GameProgress>("artikare_game_v1", EMPTY_GAME_PROGRESS, parseGameProgress);

function writeIfReadable(next: (current: GameProgress) => GameProgress): void {
  if (gameProgressStore.hasUnreadableData()) return;
  const current = gameProgressStore.getSnapshot();
  const updated = next(current);
  if (updated !== current) gameProgressStore.write(updated);
}

/** Idempotente: completar dos veces la misma actividad el mismo día no suma nada más. */
export function withActivityCompleted(progress: GameProgress, activityId: string, date: string): GameProgress {
  const done = progress.completions[date] ?? [];
  if (done.includes(activityId)) return progress;
  return { ...progress, completions: { ...progress.completions, [date]: [...done, activityId] } };
}

export function withActivityUndone(progress: GameProgress, activityId: string, date: string): GameProgress {
  const done = progress.completions[date] ?? [];
  if (!done.includes(activityId)) return progress;
  return { ...progress, completions: { ...progress.completions, [date]: done.filter((id) => id !== activityId) } };
}

export function completeActivity(activityId: string, date: string = toLimaIsoDate()): void {
  writeIfReadable((current) => withActivityCompleted(current, activityId, date));
}

export function undoActivity(activityId: string, date: string = toLimaIsoDate()): void {
  writeIfReadable((current) => withActivityUndone(current, activityId, date));
}

export function markOpened(date: string = toLimaIsoDate()): void {
  writeIfReadable((current) => (current.lastOpenedOn === date ? current : { ...current, lastOpenedOn: date }));
}

/** Solo se puede poner lo desbloqueado; quitar siempre se puede. */
export function toggleAccessory(accessory: ArtikoAccessory, unlockedAccessories: readonly ArtikoAccessory[]): void {
  writeIfReadable((current) => {
    if (current.equipped.includes(accessory)) {
      return { ...current, equipped: current.equipped.filter((item) => item !== accessory) };
    }
    return unlockedAccessories.includes(accessory) ? { ...current, equipped: [...current.equipped, accessory] } : current;
  });
}
