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

/**
 * El semáforo OMS por T-score aplica a mujeres posmenopáusicas y a hombres
 * desde esta edad; en el resto se requiere interpretación médica con Z-score.
 */
export const T_SCORE_ELIGIBILITY_MIN_AGE = 50;

/** Edad del paciente en años enteros (perfil, test y citas). */
export const PATIENT_AGE_MIN = 1;
export const PATIENT_AGE_MAX = 119;
/** Tope de la edad articular estimada por el test (edad + puntaje de riesgo). */
export const ARTICULAR_AGE_MAX = 129;

/** Escala del diario de dolor (0 = sin dolor). */
export const PAIN_LEVEL_MIN = 0;
export const PAIN_LEVEL_MAX = 10;

/** Días en que el paciente puede deshacer el borrado de un registro clínico. */
export const SOFT_DELETE_RESTORE_DAYS = 30;

/** Bandera roja: dolor ≥ 8 durante 3+ días consecutivos dentro de los últimos 14 días de Lima. */
export const SEVERE_PAIN_MIN_LEVEL = 8;
export const SEVERE_PAIN_MIN_CONSECUTIVE_DAYS = 3;
export const SEVERE_PAIN_WINDOW_DAYS = 14;

/** Meses hasta la próxima densitometría de control según la clasificación. */
export const CONTROL_MONTHS_OSTEOPOROSIS = 6;
export const CONTROL_MONTHS_DEFAULT = 12;

/**
 * Horarios de toma en formato 24 h (hora de Lima). Los `id` se persisten en
 * localStorage (artikare_pillbox_v1) y en la base (enum `dose_id`): no
 * cambiarlos sin migración. `productId` apunta al catálogo `products`.
 */
export const DOSE_SCHEDULE: readonly DoseSchedule[] = [
  {
    id: "morning-collagen",
    time: "08:30",
    label: "Colágeno Hidrolizado + Vitamina C",
    period: "morning",
    productId: "colageno-vitamina-c",
  },
  {
    id: "night-magnesium",
    time: "21:30",
    label: "Citrato de Magnesio + D3",
    period: "night",
    productId: "citrato-magnesio-d3",
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

/**
 * Hábito diario. Se premia el ACTO de registrar, nunca el valor clínico.
 * Escudo de Constancia: 1 por cada 7 días completos (máx. 2), se consume solo.
 */
export const STREAK_DAYS_PER_SHIELD = 7;
export const STREAK_MAX_SHIELDS = 2;
/** Hitos de constancia (días de racha) que desbloquean insignias. */
export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 100] as const;
/**
 * Cupón por racha: apagado hasta que el negocio confirme porcentaje y
 * vigencia. Aun encendido, se oculta con bandera roja y no lleva cuenta regresiva.
 */
export const STREAK_BENEFIT_ENABLED = false;
/** Ventana para deshacer un registro de un toque (check-in o toma). */
export const UNDO_WINDOW_MS = 10_000;
/** Días antes de volver a ofrecer los recordatorios tras un "Ahora no". */
export const REMINDER_PROMPT_SNOOZE_DAYS = 14;
/** Tope de notificaciones por día (sin patrones oscuros). */
export const MAX_DAILY_NOTIFICATIONS = 3;
