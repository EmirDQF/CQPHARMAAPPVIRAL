import { toLimaIsoDate } from "../utils/date";

const MS_PER_DAY = 86_400_000;

/**
 * Frases neutras que valoran el acto de registrar y cuidarse, nunca un valor
 * clínico ni un producto. Son iguales para cualquier paciente; se validan con
 * `findForbiddenPhrases` en el test.
 */
export const DAILY_PHRASES: readonly string[] = [
  "Registrar tu día es una forma sencilla de cuidarte.",
  "Cada registro cuenta: hoy te dedicaste un momento a ti.",
  "Gracias por tomarte este momento para cuidarte.",
  "Anotar cómo te sientes te ayuda a conversar mejor con tu médico.",
  "Los pequeños hábitos de cada día acompañan tu bienestar.",
  "Tu constancia es un regalo para ti y para quienes te quieren.",
  "Hoy también elegiste prestarle atención a tu cuerpo.",
  "Escucharte y anotarlo es parte de cuidarte bien.",
  "Paso a paso, tus registros van contando tu historia de cuidado.",
  "Darte unos minutos al día para ti vale mucho.",
  "Cada día que registras, conoces un poco más a tu cuerpo.",
  "Qué gusto verte por aquí otra vez.",
  "Si algún día no puedes, no pasa nada: retomas con calma.",
  "Tus registros son información valiosa para tu próxima consulta.",
  "Cuidarte a tu ritmo también es cuidarte.",
  "Moverte, descansar y anotar cómo te sientes: todo suma.",
];

/** Número de día calendario de Lima (días desde 1970-01-01), estable todo el día. */
function limaDayNumber(referenceDate: Date): number {
  const [year, month, day] = toLimaIsoDate(referenceDate).split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

/** Frase del día: determinista por fecha de Lima y distinta en días consecutivos. */
export function getDailyPhrase(referenceDate: Date = new Date()): string {
  return DAILY_PHRASES[limaDayNumber(referenceDate) % DAILY_PHRASES.length];
}

function normalizeStreakDays(streakDays: number): number {
  return Number.isFinite(streakDays) && streakDays > 0 ? Math.floor(streakDays) : 0;
}

/** Lema de racha + frase del día. Premia el hábito, no el resultado clínico. */
export function buildDailyReinforcementMessage(
  streakDays: number,
  referenceDate: Date = new Date()
): string {
  const phrase = getDailyPhrase(referenceDate);
  const days = normalizeStreakDays(streakDays);

  if (days === 0) {
    return `Hoy es un buen día para empezar a cuidar tu movilidad. ${phrase}`;
  }
  return `${days} ${days === 1 ? "día" : "días"} cuidando tu movilidad. ${phrase}`;
}
