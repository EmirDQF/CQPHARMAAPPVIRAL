import { z } from "zod";
import { createPersistentStore } from "../storage/persistentStore";
import { toLimaIsoDate } from "../utils/date";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const bottlesStateSchema = z.object({
  bottles: z.array(
    z.object({
      productId: z.string().min(1),
      startedOn: z.string().regex(ISO_DATE_PATTERN),
    })
  ),
});

/** Frascos iniciados con "Ya repuse mi frasco" (espejo local de la tabla `bottles`). */
export type BottlesState = z.infer<typeof bottlesStateSchema>;

export const EMPTY_BOTTLES_STATE: BottlesState = { bottles: [] };

export function parseBottlesState(raw: unknown): BottlesState | null {
  const result = bottlesStateSchema.safeParse(raw);
  return result.success ? result.data : null;
}

const store = createPersistentStore<BottlesState>(
  "artikare_bottles_v1",
  EMPTY_BOTTLES_STATE,
  parseBottlesState
);

/**
 * Registra el inicio de un frasco nuevo. Idempotente por (producto, fecha),
 * igual que `UNIQUE (user_id, product_id, started_on)` en la base.
 */
export function startNewBottle(productId: string, startedOn: string = toLimaIsoDate()): void {
  const current = store.getSnapshot();
  const alreadyStarted = current.bottles.some(
    (bottle) => bottle.productId === productId && bottle.startedOn === startedOn
  );
  if (alreadyStarted) return;

  store.write({ bottles: [...current.bottles, { productId, startedOn }] });
}

/** Fecha de inicio del frasco vigente de un producto, o null si nunca se registró uno. */
export function currentBottleStart(state: BottlesState, productId: string): string | null {
  const starts = state.bottles
    .filter((bottle) => bottle.productId === productId)
    .map((bottle) => bottle.startedOn)
    .sort();
  return starts.at(-1) ?? null;
}

export const bottlesStore = store;
