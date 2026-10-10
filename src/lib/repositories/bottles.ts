import { bottlesStore, type BottlesState } from "../dashboard/bottles";
import { bottleInsertSchema, bottleRowSchema } from "../schemas/bottle";
import { keepValid, selectRows, upsertRows, type RepositoryClient } from "./supabaseRows";
import type { RecordRepository, SyncRecord } from "./types";

/** "Empecé un frasco nuevo": producto + día de Lima en que se inició. */
export type BottleStart = BottlesState["bottles"][number];

/** Un inicio por producto y día (UNIQUE user_id, product_id, started_on); en conflicto, unión. */
export type BottleRepository = RecordRepository<BottleStart>;

const TABLE = "bottles";
const listedRowSchema = bottleRowSchema.pick({ product_id: true, started_on: true });

function toRecord(value: BottleStart): SyncRecord<BottleStart> {
  return { key: `${value.productId}|${value.startedOn}`, value, updatedAt: null };
}

function isSameStart(a: BottleStart, b: BottleStart): boolean {
  return a.productId === b.productId && a.startedOn === b.startedOn;
}

export function createLocalBottleRepository(): BottleRepository {
  return {
    async list() {
      return bottlesStore.getSnapshot().bottles.map(toRecord);
    },
    async upsertMany(values) {
      const current = bottlesStore.getSnapshot().bottles;
      const added = values.filter(
        (value, index) =>
          !current.some((bottle) => isSameStart(bottle, value)) &&
          values.findIndex((other) => isSameStart(other, value)) === index
      );
      if (added.length > 0) bottlesStore.write({ bottles: [...current, ...added] });
    },
  };
}

export function createSupabaseBottleRepository(client: RepositoryClient): BottleRepository {
  return {
    async list() {
      const rows = await selectRows(client, TABLE, "product_id, started_on", listedRowSchema);
      return rows.map((row) => toRecord({ productId: row.product_id, startedOn: row.started_on }));
    },
    async upsertMany(values) {
      const candidates = values.map((value) => ({
        product_id: value.productId,
        started_on: value.startedOn,
      }));
      const rows = keepValid(candidates, bottleInsertSchema, TABLE);
      await upsertRows(client, TABLE, rows, {
        onConflict: "user_id,product_id,started_on",
        ignoreDuplicates: true,
      });
    },
  };
}
