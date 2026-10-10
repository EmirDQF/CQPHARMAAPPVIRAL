import { z } from "zod";
import { productIdSchema } from "./product";
import { isoDateSchema, pastOrTodayLimaDateSchema, updatableRowColumns } from "./shared";

/** "Empecé un frasco nuevo": desde `started_on` solo cuentan las tomas de ese producto. */
export const bottleInsertSchema = z.object({
  product_id: productIdSchema,
  started_on: pastOrTodayLimaDateSchema,
});

/** Fila leída de Supabase: la fecha no futura ya la garantizó el reloj de la base. */
export const bottleRowSchema = z.object({
  product_id: productIdSchema,
  started_on: isoDateSchema,
  ...updatableRowColumns,
});

export type BottleInsert = z.infer<typeof bottleInsertSchema>;
export type BottleRow = z.infer<typeof bottleRowSchema>;
