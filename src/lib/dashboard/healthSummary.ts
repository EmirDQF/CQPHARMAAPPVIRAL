import { DOSE_SCHEDULE } from "../clinical/constants";
import { STIFFNESS_BUCKETS } from "../schemas/painLog";
import { lastNIsoDates } from "../utils/date";
import type { PainLogEntry, StiffnessBucket } from "./types";

/**
 * Resumen de "Mi salud": solo describe lo REGISTRADO por la persona. No
 * calcula mejorías ni las atribuye a un suplemento.
 */
const PERCENT = 100;

/** % de tomas del horario anotadas en los últimos `days` días de Lima. */
export function adherencePercent(
  takenDoseIdsByDate: Readonly<Record<string, readonly string[]>>,
  now: Date,
  days: number
): number {
  const scheduled = new Set(DOSE_SCHEDULE.map((dose) => dose.id));
  const taken = lastNIsoDates(days, now).reduce(
    (sum, date) => sum + (takenDoseIdsByDate[date] ?? []).filter((id) => scheduled.has(id)).length,
    0
  );
  return Math.round((taken / (days * scheduled.size)) * PERCENT);
}

/** Días registrados por cada rango de rigidez matinal en la ventana. */
export function stiffnessCounts(entries: readonly PainLogEntry[], days: number, now: Date): Record<StiffnessBucket, number> {
  const window = new Set(lastNIsoDates(days, now));
  const empty = Object.fromEntries(STIFFNESS_BUCKETS.map((bucket) => [bucket, 0])) as Record<StiffnessBucket, number>;
  return entries
    .filter((entry) => window.has(entry.date))
    .reduce((counts, entry) => ({ ...counts, [entry.stiffness]: counts[entry.stiffness] + 1 }), empty);
}

export type NextBestActionId = "evaluacion" | "toma" | "chequeo" | "densitometria" | "aprender" | "descanso";

export interface NextBestActionInput {
  hasRedFlag: boolean;
  hasBoneScan: boolean;
  checkedInToday: boolean;
  /** Hay una toma cuya hora ya llegó y no se anotó. */
  pendingDoseNow: boolean;
  learnedToday: boolean;
}

export interface NextBestAction {
  id: NextBestActionId;
  emoji: string;
  title: string;
  detail: string;
  cta: string;
}

const ACTIONS: Readonly<Record<NextBestActionId, NextBestAction>> = {
  evaluacion: { id: "evaluacion", emoji: "🩺", title: "Agenda tu evaluación reumatológica", detail: "Por lo que registraste, lo más importante ahora es que te vea un especialista.", cta: "Agendar evaluación" },
  toma: { id: "toma", emoji: "⏰", title: "Anota tu toma de ahora", detail: "Ya es la hora de una de tus tomas indicadas.", cta: "Ir a Mi día" },
  chequeo: { id: "chequeo", emoji: "📝", title: "Haz tu chequeo de hoy", detail: "Dos toques: cómo amanecieron tus articulaciones y cuánto duró la rigidez.", cta: "Ir al chequeo" },
  densitometria: { id: "densitometria", emoji: "🩻", title: "Registra tu densitometría", detail: "Con tu resultado verás tu Semáforo Óseo. Si aún no la tienes, puedes agendarla.", cta: "Registrar resultado" },
  aprender: { id: "aprender", emoji: "📚", title: "Aprende algo nuevo en 2 minutos", detail: "Una lección corta sobre huesos y articulaciones.", cta: "Ir a Aprender" },
  descanso: { id: "descanso", emoji: "🌿", title: "Todo al día", detail: "Hiciste lo de hoy. Disfruta tu tarde con calma.", cta: "Ver mis logros" },
};

/** Una sola "siguiente mejor acción". La bandera roja siempre va primero. */
export function pickNextBestAction(input: NextBestActionInput): NextBestAction {
  if (input.hasRedFlag) return ACTIONS.evaluacion;
  if (input.pendingDoseNow) return ACTIONS.toma;
  if (!input.checkedInToday) return ACTIONS.chequeo;
  if (!input.hasBoneScan) return ACTIONS.densitometria;
  if (!input.learnedToday) return ACTIONS.aprender;
  return ACTIONS.descanso;
}
