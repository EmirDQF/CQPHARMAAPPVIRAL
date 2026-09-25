import { z } from "zod";
import { T_SCORE_INPUT_MAX, T_SCORE_INPUT_MIN } from "../clinical/constants";
import { pastOrTodayLimaDateSchema, updatableRowColumns } from "./shared";

const T_SCORE_DECIMALS_FACTOR = 100;
const FLOAT_TOLERANCE = 1e-9;

/** Máximo 2 decimales, como el informe: un tercero se rechaza, nunca se redondea a través de un umbral OMS. */
function hasAtMostTwoDecimals(value: number): boolean {
  const scaled = value * T_SCORE_DECIMALS_FACTOR;
  return Math.abs(scaled - Math.round(scaled)) < FLOAT_TOLERANCE;
}

const tScoreSchema = z
  .number()
  .min(T_SCORE_INPUT_MIN)
  .max(T_SCORE_INPUT_MAX)
  .refine(hasAtMostTwoDecimals, { message: "El T-score admite hasta 2 decimales" });

export const RADIOLOGY_CENTER_MAX = 120;

/** Un estudio por día y paciente (UNIQUE user_id, scan_date). */
export const dexaScanInsertSchema = z.object({
  scan_date: pastOrTodayLimaDateSchema,
  lumbar_t: tScoreSchema,
  femoral_t: tScoreSchema,
  radiology_center: z.string().trim().max(RADIOLOGY_CENTER_MAX),
});

export const dexaScanRowSchema = dexaScanInsertSchema.extend(updatableRowColumns);

export type DexaScanInsert = z.infer<typeof dexaScanInsertSchema>;
export type DexaScanRow = z.infer<typeof dexaScanRowSchema>;
