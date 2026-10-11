import { z } from "zod";
import { T_SCORE_INPUT_MAX, T_SCORE_INPUT_MIN } from "../clinical/constants";
import {
  hasAtMostDecimals,
  isoDateSchema,
  pastOrTodayLimaDateSchema,
  softDeletableRowColumns,
} from "./shared";

/** Máximo 2 decimales, como el informe: un tercero se rechaza, nunca se redondea a través de un umbral OMS. */
const T_SCORE_DECIMALS = 2;

const tScoreSchema = z
  .number()
  .min(T_SCORE_INPUT_MIN)
  .max(T_SCORE_INPUT_MAX)
  .refine((tScore) => hasAtMostDecimals(tScore, T_SCORE_DECIMALS), {
    message: "El T-score admite hasta 2 decimales",
  });

const RADIOLOGY_CENTER_MAX = 120;

const dexaScanValueColumns = {
  lumbar_t: tScoreSchema,
  femoral_t: tScoreSchema,
  radiology_center: z.string().trim().max(RADIOLOGY_CENTER_MAX),
};

/** Un estudio por día y paciente (UNIQUE user_id, scan_date). */
export const dexaScanInsertSchema = z.object({
  scan_date: pastOrTodayLimaDateSchema,
  ...dexaScanValueColumns,
});

/**
 * Fila leída de Supabase. La base ya rechazó fechas futuras con su propio reloj;
 * revalidarlas con el del celular solo descartaría filas válidas si va atrasado.
 */
export const dexaScanRowSchema = z.object({
  scan_date: isoDateSchema,
  ...dexaScanValueColumns,
  ...softDeletableRowColumns,
});

export type DexaScanInsert = z.infer<typeof dexaScanInsertSchema>;
export type DexaScanRow = z.infer<typeof dexaScanRowSchema>;
