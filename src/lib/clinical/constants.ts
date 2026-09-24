import type { DoseSchedule } from "../dashboard/types";

/**
 * Constantes clínicas canónicas de Artikare. Cualquier umbral, horario o
 * porcentaje que aparezca en la UI o en la lógica debe salir de aquí para que
 * nunca existan dos versiones distintas de la misma regla.
 */

/** Zona horaria de la clínica y de todos los registros diarios del paciente. */
export const CLINIC_TIME_ZONE = "America/Lima";

/**
 * Clasificación densitométrica de la OMS por T-score:
 * Normal T ≥ -1.0 · Osteopenia -2.5 < T < -1.0 · Osteoporosis T ≤ -2.5.
 */
export const WHO_T_SCORE_NORMAL_MIN = -1.0;
export const WHO_T_SCORE_OSTEOPOROSIS_MAX = -2.5;

/** Rango plausible de un T-score ingresado a mano; fuera de él se asume error de tipeo. */
export const T_SCORE_INPUT_MIN = -6.0;
export const T_SCORE_INPUT_MAX = 4.0;

/** Meses hasta la próxima densitometría de control según la clasificación. */
export const CONTROL_MONTHS_OSTEOPOROSIS = 6;
export const CONTROL_MONTHS_DEFAULT = 12;

/**
 * Horarios de toma en formato 24 h (hora de Lima). Los `id` se persisten en
 * localStorage (artikare_pillbox_v1): no cambiarlos sin migración.
 */
export const DOSE_SCHEDULE: readonly DoseSchedule[] = [
  {
    id: "morning-collagen",
    time: "08:30",
    label: "Colágeno Hidrolizado + Vitamina C",
    period: "morning",
  },
  {
    id: "night-magnesium",
    time: "21:30",
    label: "Citrato de Magnesio + D3",
    period: "night",
  },
];

/** Tomas por frasco CQ Pharma (una toma diaria = 60 días). */
export const BOTTLE_SERVINGS = 60;
/** Día de consumo en que se activa la reposición (quedan 10 tomas). */
export const RESTOCK_TRIGGER_DAY = 50;
/** Descuento de fidelización al reponer el pack antes de interrumpir el tratamiento. */
export const RESTOCK_DISCOUNT_PERCENT = 10;
/** Descuento del pack sugerido al confirmar una cita de densitometría. */
export const DENSITOMETRY_UPSELL_DISCOUNT_PERCENT = 20;
