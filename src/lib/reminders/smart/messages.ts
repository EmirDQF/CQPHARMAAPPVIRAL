/**
 * Mensajes de los avisos de Artiko (es-PE). Aparecen en la pantalla
 * bloqueada: son GENÉRICOS, sin datos ni términos de salud, sin culpa ni
 * urgencia (lo verifica messages.test.ts). `{streak}` se reemplaza por los
 * días activos. Cada franja tiene ≥ 7 variantes: rotar por día evita repetir
 * en 7 días.
 */
export const NUDGE_SLOTS = ["morning", "afternoon", "evening"] as const;
export type NudgeSlot = (typeof NUDGE_SLOTS)[number];

export interface NudgeMessage {
  id: string;
  title: string;
  body: string;
}

export const NUDGE_TITLE = "Artikare";

const MORNING: readonly string[] = [
  "¡Buenos días! ☀️ Artiko ya está listo. ¿Empezamos tus misiones de hoy?",
  "¡Hola! 🎉 Hay misiones esperándote. Solo te lleva 1 minuto.",
  "Un nuevo día, una nueva misión ⭐ Artiko te acompaña.",
  "¡Arriba ese ánimo! 💪 Tu primera misión de hoy es cortita.",
  "Artiko preparó tus misiones de hoy 🎯 Cuando quieras, empezamos.",
  "¡Hola de nuevo! ☀️ Un minutito para ti y listo.",
  "Buenos días 🌱 Pequeños pasos, todos los días. ¿Vamos?",
  "¡Llegó Artiko! 🦸 Tus misiones de hoy ya están aquí.",
  "Hoy también suma ✨ Abre Artikare y mira tu primera misión.",
];

const AFTERNOON: readonly string[] = [
  "Un ratito para ti 💪 Ve tus misiones de hoy y suma tu racha de {streak} días 🔥",
  "¡Hola de nuevo! 🎉 Hay misiones esperándote. Solo te lleva 1 minuto.",
  "Artiko te guardó una misión cortita 🎯 ¿La vemos?",
  "Pausa de la tarde ☕ Un minuto con Artiko y seguimos.",
  "¡Tu racha de {streak} días 🔥 te saluda! Mira tus misiones de hoy.",
  "Artiko está listo para la siguiente misión ⭐ Cuando puedas.",
  "Un minutito para ti 🌤️ Tus misiones de hoy te esperan.",
  "¡Hola! 👋 Hay una misión nueva para ti en Artikare.",
  "Sumar XP es fácil ⭐ Una misión corta y listo.",
];

const EVENING: readonly string[] = [
  "Todavía hay tiempo de hoy ✨ Artiko te acompaña con las que faltan.",
  "Buenas noches 🌙 Si te provoca, una misión cortita antes de descansar.",
  "Artiko sigue aquí ✨ Una misión más y cerramos el día.",
  "Un minuto para ti antes de dormir 🌙 Tus misiones te esperan.",
  "¡Hola! 🌟 Queda una misión fácil para hoy.",
  "Tu racha de {streak} días 🔥 te acompaña. Mira lo que queda de hoy.",
  "Antes de descansar 😴 Artiko te muestra lo que falta, sin apuro.",
  "Cerramos el día juntos ✨ Una misión cortita en Artikare.",
  "Buenas noches 🌙 Lo que hiciste hoy ya cuenta. ¿Una más?",
];

function toMessages(slot: NudgeSlot, bodies: readonly string[]): NudgeMessage[] {
  return bodies.map((body, index) => ({ id: `${slot}-${index + 1}`, title: NUDGE_TITLE, body }));
}

export const NUDGE_MESSAGES: Readonly<Record<NudgeSlot, readonly NudgeMessage[]>> = {
  morning: toMessages("morning", MORNING),
  afternoon: toMessages("afternoon", AFTERNOON),
  evening: toMessages("evening", EVENING),
};

/** Último aviso antes de la pausa amable (3+ días sin abrir); después, silencio. */
export const PAUSE_MESSAGE: NudgeMessage = {
  id: "pause-1",
  title: NUDGE_TITLE,
  body: "Aquí estaré cuando quieras volver 🦸",
};

const MS_PER_DAY = 86_400_000;

/** Días desde 1970-01-01 de una fecha YYYY-MM-DD (independiente de la zona). */
export function epochDay(isoDate: string): number {
  return Math.round(Date.parse(`${isoDate}T00:00:00Z`) / MS_PER_DAY);
}

/** Mensaje del día para la franja: rota por día, sin repetir en 7 días (≥ 7 variantes). */
export function pickNudgeMessage(slot: NudgeSlot, today: string, streakDays: number): NudgeMessage {
  const options = NUDGE_MESSAGES[slot];
  const message = options[epochDay(today) % options.length];
  return { ...message, body: fillStreak(message.body, streakDays) };
}

/** Sin racha todavía, la frase de racha se reemplaza por una neutra. */
export function fillStreak(body: string, streakDays: number): string {
  if (!body.includes("{streak}")) return body;
  if (streakDays < 1) return "¡Hola de nuevo! 🎉 Hay misiones esperándote. Solo te lleva 1 minuto.";
  return body.replaceAll("{streak}", String(streakDays));
}
