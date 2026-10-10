import { z } from "zod";
import { PAIN_LEVEL_MAX, PAIN_LEVEL_MIN } from "../clinical/constants";
import type { StiffnessBucket } from "../dashboard/types";
import { isoDateSchema, pastOrTodayLimaDateSchema, softDeletableRowColumns } from "./shared";

export const STIFFNESS_BUCKETS = ["0-15", "15-30", "30+"] as const satisfies readonly StiffnessBucket[];

const painLogValueColumns = {
  pain_level: z.number().int().min(PAIN_LEVEL_MIN).max(PAIN_LEVEL_MAX),
  stiffness: z.enum(STIFFNESS_BUCKETS),
};

/** Un registro por día de Lima (UNIQUE user_id, log_date); en conflicto gana el `updated_at` más reciente. */
export const painLogInsertSchema = z.object({
  log_date: pastOrTodayLimaDateSchema,
  ...painLogValueColumns,
});

/** Fila leída de Supabase: la fecha no futura ya la garantizó el reloj de la base. */
export const painLogRowSchema = z.object({
  log_date: isoDateSchema,
  ...painLogValueColumns,
  ...softDeletableRowColumns,
});

export type PainLogInsert = z.infer<typeof painLogInsertSchema>;
export type PainLogRow = z.infer<typeof painLogRowSchema>;
