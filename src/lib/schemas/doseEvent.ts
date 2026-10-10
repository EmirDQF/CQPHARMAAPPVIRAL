import { z } from "zod";
import { DOSE_SCHEDULE } from "../clinical/constants";
import { productIdSchema } from "./product";
import {
  isoDateSchema,
  notFutureTimestampSchema,
  pastOrTodayLimaDateSchema,
  softDeletableRowColumns,
  timestampSchema,
} from "./shared";

/** Valores del enum `dose_id` de la base, en el orden de DOSE_SCHEDULE. */
export const DOSE_IDS: readonly string[] = DOSE_SCHEDULE.map((dose) => dose.id);

const doseIdSchema = z.enum(DOSE_IDS, { error: "Toma fuera del horario" });

/** Una toma por horario y día de Lima (UNIQUE user_id, dose_id, taken_on); en conflicto, unión. */
export const doseEventInsertSchema = z.object({
  dose_id: doseIdSchema,
  product_id: productIdSchema,
  taken_on: pastOrTodayLimaDateSchema,
  taken_at: notFutureTimestampSchema,
});

/** Fila leída de Supabase: los límites contra "ahora" ya los aplicó el reloj de la base. */
export const doseEventRowSchema = z.object({
  dose_id: doseIdSchema,
  product_id: productIdSchema,
  taken_on: isoDateSchema,
  taken_at: timestampSchema,
  ...softDeletableRowColumns,
});

export type DoseEventInsert = z.infer<typeof doseEventInsertSchema>;
export type DoseEventRow = z.infer<typeof doseEventRowSchema>;
