import { z } from "zod";
import { toLimaIsoDate } from "../utils/date";

/**
 * Fecha diaria (YYYY-MM-DD, día de Lima) que no puede ser futura. Replica el
 * CHECK `<= (now() at time zone 'America/Lima')::date` de la base.
 */
export const pastOrTodayLimaDateSchema = z.iso
  .date()
  .refine((isoDate) => isoDate <= toLimaIsoDate(), { message: "La fecha no puede ser futura" });

/** timestamptz tal como lo devuelve PostgREST (con offset y microsegundos). */
export const timestampSchema = z.iso.datetime({ offset: true });

/** Columnas que la base agrega a toda fila propia del paciente. */
export const ownedRowColumns = {
  id: z.uuid(),
  user_id: z.uuid(),
  created_at: timestampSchema,
};

export const updatableRowColumns = {
  ...ownedRowColumns,
  updated_at: timestampSchema,
};
