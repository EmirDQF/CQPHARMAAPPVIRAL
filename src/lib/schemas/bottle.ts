import { z } from "zod";
import { pastOrTodayLimaDateSchema, updatableRowColumns } from "./shared";

/** "Empecé un frasco nuevo": desde `started_on` solo cuentan las tomas de ese producto. */
export const bottleInsertSchema = z.object({
  product_id: z.string().min(1),
  started_on: pastOrTodayLimaDateSchema,
});

export const bottleRowSchema = bottleInsertSchema.extend(updatableRowColumns);

export type BottleInsert = z.infer<typeof bottleInsertSchema>;
export type BottleRow = z.infer<typeof bottleRowSchema>;
