import type { Activity } from "../activities/schemas";
import type { ArtikoEmotion } from "../mascot/mascot";
import { MASCOT } from "../mascot/mascot";
import { addDaysToIsoDate, limaMinutesOfDay, time24hToMinutes } from "../utils/date";

/**
 * Qué cara pone Artiko al abrir "Hoy" y qué dice en su globo (sin
 * notificación). Siempre ánimo, nunca culpa: no menciona días perdidos ni
 * usa urgencia. Con bandera roja, primero el reumatólogo.
 */
export const RETURN_AFTER_DAYS = 3;
const EVENING_START = time24hToMinutes("18:00");
const SLEEP_START = time24hToMinutes("22:00");
const MORNING_START = time24hToMinutes("06:00");
const FIRE_STREAK_MIN_DAYS = 3;

export interface MoodInput {
  now: Date;
  today: string;
  hasRedFlag: boolean;
  goalMet: boolean;
  streakDays: number;
  /** Día de la última apertura ANTES de hoy (null = primera vez). */
  lastOpenedOn: string | null;
  nextMission: Activity | null;
}

export interface ArtikoMood {
  emotion: ArtikoEmotion;
  message: string;
}

export function isReturningAfterBreak(lastOpenedOn: string | null, today: string): boolean {
  return lastOpenedOn !== null && lastOpenedOn <= addDaysToIsoDate(today, -RETURN_AFTER_DAYS);
}

function nextMissionText(mission: Activity | null): string {
  return mission ? `Tu siguiente misión: ${mission.emoji} ${mission.title}.` : "Hoy ya hiciste tus misiones.";
}

export function pickArtikoMood(input: MoodInput): ArtikoMood {
  const minutes = limaMinutesOfDay(input.now);
  if (input.hasRedFlag) {
    return {
      emotion: "waiting",
      message: "Lo primero hoy es tu evaluación con el reumatólogo. Las actividades físicas esperan hasta que tu médico lo indique.",
    };
  }
  if (input.goalMet) return { emotion: "flexing", message: "¡Meta del día cumplida! 💪 Gracias por dedicarte este rato." };
  if (isReturningAfterBreak(input.lastOpenedOn, input.today)) {
    return { emotion: "welcome", message: `¡Qué bueno verte! 🥳 Retomamos desde aquí, sin presión. ${nextMissionText(input.nextMission)}` };
  }
  if (minutes >= SLEEP_START || minutes < MORNING_START) {
    return { emotion: "sleepy", message: `Ya es tarde: descansar también es cuidarte. ${MASCOT.name} te espera mañana ✨` };
  }
  if (input.streakDays >= FIRE_STREAK_MIN_DAYS) {
    return { emotion: "fire_streak", message: `¡${input.streakDays} días activos! 🔥 ${nextMissionText(input.nextMission)}` };
  }
  if (minutes >= EVENING_START) {
    return { emotion: "heads_up", message: `Todavía hay tiempo de hoy ✨ ${nextMissionText(input.nextMission)}` };
  }
  return { emotion: "happy", message: `¡Hola! ☀️ ${nextMissionText(input.nextMission)}` };
}
