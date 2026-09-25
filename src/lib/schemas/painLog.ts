import { z } from "zod";
import { PAIN_LEVEL_MAX, PAIN_LEVEL_MIN } from "../clinical/constants";
import type { StiffnessBucket } from "../dashboard/types";
import { pastOrTodayLimaDateSchema, updatableRowColumns } from "./shared";

export const STIFFNESS_BUCKETS = ["0-15", "15-30", "30+"] as const satisfies readonly StiffnessBucket[];

/** Un registro por día de Lima (UNIQUE user_id, log_date); en conflicto gana el `updated_at` más reciente. */
export const painLogInsertSchema = z.object({
  log_date: pastOrTodayLimaDateSchema,
  pain_level: z.number().int().min(PAIN_LEVEL_MIN).max(PAIN_LEVEL_MAX),
  stiffness: z.enum(STIFFNESS_BUCKETS),
});

export const painLogRowSchema = painLogInsertSchema.extend(updatableRowColumns);

export type PainLogInsert = z.infer<typeof painLogInsertSchema>;
export type PainLogRow = z.infer<typeof painLogRowSchema>;
