import { z } from "zod";
import { DOSE_SCHEDULE } from "../clinical/constants";
import { pastOrTodayLimaDateSchema, timestampSchema, updatableRowColumns } from "./shared";

function isScheduledDoseId(doseId: string): boolean {
  return DOSE_SCHEDULE.some((dose) => dose.id === doseId);
}

/** Una toma por horario y día de Lima (UNIQUE user_id, dose_id, taken_on); en conflicto, unión. */
export const doseEventInsertSchema = z.object({
  dose_id: z.string().refine(isScheduledDoseId, { message: "Toma fuera del horario" }),
  product_id: z.string().min(1),
  taken_on: pastOrTodayLimaDateSchema,
  taken_at: timestampSchema,
});

export const doseEventRowSchema = doseEventInsertSchema.extend(updatableRowColumns);

export type DoseEventInsert = z.infer<typeof doseEventInsertSchema>;
export type DoseEventRow = z.infer<typeof doseEventRowSchema>;
