import { toLimaIsoDate } from "../utils/date";

/**
 * Frases motivadoras de Artikare (es-PE). Valoran el hábito de cuidarse, nunca
 * un resultado clínico ni un producto: sin culpa, sin urgencia y sin
 * promesas. Se validan con `findForbiddenPhrases` en el test. Contenido
 * pendiente de validación del médico del proyecto (docs/BLOCKERS.md).
 */
export const MOTIVATION_CATEGORIES = [
  "inicio",
  "constancia",
  "tomas",
  "movimiento",
  "huesos",
  "retomar",
  "celebracion",
  "cierre",
  "familia",
] as const;

export type MotivationCategory = (typeof MOTIVATION_CATEGORIES)[number];

export interface MotivationalPhrase {
  text: string;
  category: MotivationCategory;
}

export const MAX_PHRASE_LENGTH = 110;
export const NO_REPEAT_WINDOW_DAYS = 14;

const phrase = (category: MotivationCategory, text: string): MotivationalPhrase => ({ category, text });

export const MOTIVATIONAL_PHRASES: readonly MotivationalPhrase[] = [
  phrase("inicio", "☀️ Buen día. Hoy empieza otra oportunidad de cuidarte con calma."),
  phrase("inicio", "🌱 Un pequeño paso al despertar ya es un buen comienzo."),
  phrase("inicio", "☕ Respira hondo y empieza el día a tu ritmo."),
  phrase("inicio", "🌤️ Qué gusto saludarte. Hoy también estamos contigo."),
  phrase("inicio", "📝 Un minuto para ti en la mañana vale mucho."),
  phrase("inicio", "🙂 Empieza el día con una sonrisa; lo demás llega paso a paso."),
  phrase("inicio", "🌻 Hoy es un buen día para escucharte."),
  phrase("constancia", "🔁 La constancia no es perfección: es volver cada día."),
  phrase("constancia", "🧩 Cada registro es una pieza más de tu historia de cuidado."),
  phrase("constancia", "🐢 Despacio también se llega. Lo importante es seguir."),
  phrase("constancia", "📅 Los hábitos pequeños, repetidos, hacen una gran diferencia."),
  phrase("constancia", "💪 Tu dedicación de hoy dice mucho de ti."),
  phrase("constancia", "🌿 Cuidarte un poquito cada día también cuenta."),
  phrase("constancia", "⭐ No tiene que ser perfecto, solo tiene que ser tuyo."),
  phrase("tomas", "⏰ Anotar tus tomas te ayuda a llevar tu plan en orden."),
  phrase("tomas", "📋 Tus tomas indicadas, a su hora y sin apuros."),
  phrase("tomas", "✅ Marcar una toma es un pequeño gesto de cuidado."),
  phrase("tomas", "🗒️ Llevar tu registro facilita la conversación con tu médico."),
  phrase("tomas", "🕗 Un recordatorio amable: tu plan del día te espera cuando quieras."),
  phrase("tomas", "🤝 Seguir lo que indicó tu médico es trabajo en equipo."),
  phrase("tomas", "💬 Si tienes dudas sobre tus tomas, tu médico es tu mejor aliado."),
  phrase("movimiento", "🚶 Un paseo corto, si te sientes bien, también es cuidarte."),
  phrase("movimiento", "🧘 Estírate con suavidad y escucha a tu cuerpo."),
  phrase("movimiento", "🌳 Moverte un poco, a tu ritmo, alegra el día."),
  phrase("movimiento", "🪑 Levántate de la silla de vez en cuando y date un respiro."),
  phrase("movimiento", "💃 Un poco de música y movimiento suave pueden alegrarte la tarde."),
  phrase("movimiento", "👟 El mejor movimiento es el que disfrutas y tu médico aprueba."),
  phrase("movimiento", "🌬️ Respira, estírate y sigue con tu día."),
  phrase("huesos", "🦴 Tus huesos te acompañan cada día; acompáñalos tú también."),
  phrase("huesos", "🦵 Cuidar tus articulaciones es cuidar tus momentos favoritos."),
  phrase("huesos", "🥛 Una alimentación variada es parte de cuidarte."),
  phrase("huesos", "🌞 Un rato al aire libre puede alegrarte el día."),
  phrase("huesos", "🏠 Una casa ordenada y bien iluminada te acompaña en cada paso."),
  phrase("huesos", "🩺 Tus controles con el médico son parte de tu cuidado."),
  phrase("huesos", "🧠 Conocer más sobre tus huesos te ayuda a hacer mejores preguntas."),
  phrase("retomar", "🤗 Qué bueno verte de nuevo. Retomamos sin apuro."),
  phrase("retomar", "🌈 Una pausa no borra lo que ya hiciste por ti."),
  phrase("retomar", "🔆 Cada día es una nueva oportunidad para empezar."),
  phrase("retomar", "🍃 Si ayer no pudiste, hoy es un buen día para seguir."),
  phrase("retomar", "🫶 Aquí no hay reproches: solo ganas de acompañarte."),
  phrase("retomar", "🚪 La puerta siempre está abierta para volver a cuidarte."),
  phrase("retomar", "🌅 Volver también es avanzar."),
  phrase("celebracion", "🎉 ¡Bien hecho! Hoy te diste un momento para ti."),
  phrase("celebracion", "🏅 Cada día que te cuidas merece una celebración."),
  phrase("celebracion", "🥳 ¡Lo lograste! Tu constancia vale oro."),
  phrase("celebracion", "🌟 Brillas cuando te cuidas. ¡Sigue así!"),
  phrase("celebracion", "👏 Un aplauso para ti por cuidarte hoy."),
  phrase("celebracion", "🎈 Pequeños logros, grandes alegrías."),
  phrase("celebracion", "💛 Gracias por darte este tiempo. Lo estás haciendo bien."),
  phrase("cierre", "🌙 Buenas noches. Descansa, mañana seguimos juntos."),
  phrase("cierre", "😴 Un buen descanso también es parte de cuidarte."),
  phrase("cierre", "✨ Hoy hiciste lo que pudiste, y eso está bien."),
  phrase("cierre", "🛏️ Cierra el día con calma y gratitud."),
  phrase("cierre", "🌌 Cada día suma. Que tengas una noche tranquila."),
  phrase("cierre", "📖 Anota cómo te fue hoy y deja que la noche te abrace."),
  phrase("cierre", "🕯️ Respira despacio antes de dormir. Te lo mereces."),
  phrase("familia", "👨‍👩‍👧 Cuidarte también es un regalo para tu familia."),
  phrase("familia", "📞 Llama a alguien querido y cuéntale cómo va tu día."),
  phrase("familia", "💌 Invita a tu mamá o a tu papá a cuidarse contigo."),
  phrase("familia", "🫂 Acompañar a quien te cuidó es una forma de agradecer."),
  phrase("familia", "👵 Las mejores historias se cuentan en familia y con salud."),
  phrase("familia", "🤲 Cuidarte en equipo es más fácil y más bonito."),
  phrase("familia", "🏡 En casa, cada gesto de cuidado cuenta."),
  phrase("familia", "💞 Gracias a quienes cuidan a los suyos todos los días."),
];

const MS_PER_DAY = 86_400_000;
// Saltos coprimos con el total: recorren todas las frases antes de repetir y
// evitan que días seguidos caigan en la misma categoría.
const DAY_STEP_CANDIDATES = [7, 11, 13, 17, 19, 23] as const;
const OFFSET_STEP = 1;

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

function dayStep(total: number): number {
  return DAY_STEP_CANDIDATES.find((step) => greatestCommonDivisor(step, total) === 1) ?? 1;
}

/** Número de día calendario de Lima (días desde 1970-01-01), estable todo el día. */
export function limaDayNumber(referenceDate: Date): number {
  const [year, month, day] = toLimaIsoDate(referenceDate).split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

function safeOffset(offset: number): number {
  return Number.isFinite(offset) && offset > 0 ? Math.floor(offset) : 0;
}

export interface PhraseOptions {
  /** Con una bandera roja no se sugiere movimiento: prima la evaluación médica. */
  hasRedFlag?: boolean;
}

/**
 * Frase del día por fecha de Lima, sin repetirse en `NO_REPEAT_WINDOW_DAYS`.
 * `offset` > 0 es el botón "Otra frase": avanza dentro del mismo día.
 */
export function getMotivationalPhrase(
  referenceDate: Date = new Date(),
  offset = 0,
  { hasRedFlag = false }: PhraseOptions = {}
): MotivationalPhrase {
  const total = MOTIVATIONAL_PHRASES.length;
  const base = limaDayNumber(referenceDate) * dayStep(total);
  for (let extra = 0; extra < total; extra += 1) {
    const index = (base + (safeOffset(offset) + extra) * OFFSET_STEP) % total;
    const candidate = MOTIVATIONAL_PHRASES[index];
    if (!hasRedFlag || candidate.category !== "movimiento") return candidate;
  }
  return MOTIVATIONAL_PHRASES[0];
}
