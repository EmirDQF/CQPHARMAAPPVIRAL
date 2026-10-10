import { z } from "zod";
import { toLimaIsoDate } from "../utils/date";

/**
 * Margen para la deriva del reloj del celular; replica el CHECK
 * `<= now() + interval '5 minutes'` de `dose_events.taken_at` y `consents.granted_at`.
 */
export const CLIENT_CLOCK_SKEW_MINUTES = 5;
const MS_PER_MINUTE = 60_000;

/** Fecha diaria tal como la guarda una columna `date`: YYYY-MM-DD, sin hora ni zona. */
export const isoDateSchema = z.iso.date();

/**
 * Fecha diaria (YYYY-MM-DD, día de Lima) que no puede ser futura. Replica el
 * CHECK `<= (now() at time zone 'America/Lima')::date` de la base.
 */
export const pastOrTodayLimaDateSchema = isoDateSchema.refine(
  (isoDate) => isoDate <= toLimaIsoDate(),
  { message: "La fecha no puede ser futura" }
);

/** timestamptz tal como lo devuelve PostgREST (con offset y microsegundos); sin zona se rechaza. */
export const timestampSchema = z.iso.datetime({ offset: true });

/** Instante enviado por el cliente: no más de CLIENT_CLOCK_SKEW_MINUTES en el futuro. */
export const notFutureTimestampSchema = timestampSchema.refine(
  (timestamp) => Date.parse(timestamp) <= Date.now() + CLIENT_CLOCK_SKEW_MINUTES * MS_PER_MINUTE,
  { message: "La hora no puede ser futura" }
);

const FLOAT_TOLERANCE = 1e-9;

/**
 * Igual que `scale(x) <= decimals` (o `numeric(p, decimals)`) en la base, pero
 * rechazando el decimal sobrante en vez de redondearlo en silencio.
 */
export function hasAtMostDecimals(value: number, decimals: number): boolean {
  const scaled = value * 10 ** decimals;
  return Math.abs(scaled - Math.round(scaled)) < FLOAT_TOLERANCE;
}

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

/**
 * Filas con borrado suave (`dexa_scans`, `pain_logs`, `dose_events`). RLS solo
 * devuelve las vigentes (null); opcional porque un SELECT de columnas puede omitirla.
 */
export const softDeletableRowColumns = {
  ...updatableRowColumns,
  deleted_at: timestampSchema.nullable().optional(),
};
