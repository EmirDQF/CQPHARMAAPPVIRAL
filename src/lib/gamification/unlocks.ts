import { z } from "zod";
import { findForbiddenPhrases } from "../clinical/forbiddenCopy";
import { ARTIKO_ACCESSORIES } from "../mascot/mascot";
import { ACTIVITY_CATEGORIES } from "../activities/schemas";
import { LEARNING_KEY } from "./progress";

/**
 * Insignias y accesorios cosméticos de Artiko. Se ganan solo con constancia
 * (días activos, metas, nivel, racha, aprender, invitar): nunca con compras,
 * nunca por el valor de dolor registrado. Lo ganado no se quita jamás.
 */
const countSchema = z.number().int().min(1).max(366);

export const gameRuleSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("activeDays"), total: countSchema }),
  z.object({ type: z.literal("goalDays"), total: countSchema }),
  z.object({ type: z.literal("level"), level: countSchema }),
  z.object({ type: z.literal("streak"), days: countSchema }),
  z.object({ type: z.literal("categoryDays"), category: z.enum(ACTIVITY_CATEGORIES), total: countSchema }),
  /** Reto "Semana constante": se gana una vez por semana de Lima (lun–dom). */
  z.object({ type: z.literal("weeklyChallenge") }),
  /** Lecciones o juegos distintos completados alguna vez (nunca por acertar más). */
  z.object({ type: z.literal("learningCount"), kind: z.enum(["lesson", "game"]), total: countSchema }),
  /** Completar todas estas lecciones o juegos ("lesson:<id>" / "game:<id>"), en cualquier orden. */
  z.object({ type: z.literal("learningSet"), keys: z.array(z.string().regex(LEARNING_KEY)).min(1) }),
]);
export type GameRule = z.infer<typeof gameRuleSchema>;

/**
 * Insignias educativas pueden nombrar un nutriente ("Guardián de la Vitamina D"),
 * pero nunca una marca o producto, una promesa de cura ni culpa.
 */
function isAllowedCopy(text: string): boolean {
  return findForbiddenPhrases(text).every((finding) => finding.category === "producto-ingrediente" && !finding.id.startsWith("marca-"));
}

const copy = (max: number) => z.string().trim().min(1).max(max).refine(isAllowedCopy, { message: "Frase prohibida" });

export const gameUnlockSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{3,40}$/),
  emoji: z.string().min(1).max(8),
  title: copy(40),
  description: copy(140),
  rule: gameRuleSchema,
  /** Si existe, desbloquea ese accesorio cosmético de Artiko. */
  accessory: z.enum(ARTIKO_ACCESSORIES).optional(),
  /** Se puede compartir como tarjeta (sin datos de salud). */
  shareable: z.boolean(),
});
export type GameUnlock = z.infer<typeof gameUnlockSchema>;

const RAW_UNLOCKS: readonly GameUnlock[] = [
  { id: "primera-mision", emoji: "⭐", title: "Primera misión", description: "Completaste tu primera misión con Artiko.", rule: { type: "activeDays", total: 1 }, shareable: false },
  { id: "meta-del-dia", emoji: "🎯", title: "Meta del día", description: "Cumpliste tu meta diaria por primera vez.", rule: { type: "goalDays", total: 1 }, shareable: true },
  { id: "gorra-racha-3", emoji: "🧢", title: "Gorra deportiva", description: "Tres días activos seguidos: Artiko estrena gorra.", rule: { type: "streak", days: 3 }, accessory: "cap", shareable: true },
  { id: "bufanda-nivel-3", emoji: "🧣", title: "Bufanda de nivel 3", description: "Llegaste al nivel 3. Artiko se abriga contigo.", rule: { type: "level", level: 3 }, accessory: "scarf", shareable: true },
  { id: "lentes-mente-3", emoji: "🤓", title: "Lentes de curiosidad", description: "Tres días aprendiendo algo nuevo.", rule: { type: "categoryDays", category: "mente", total: 3 }, accessory: "glasses", shareable: true },
  { id: "corazon-familiar", emoji: "💌", title: "Corazón familiar", description: "Animaste a alguien de tu familia a cuidarse.", rule: { type: "categoryDays", category: "social", total: 1 }, shareable: false },
  { id: "semana-constante", emoji: "🔥", title: "Semana constante", description: "Siete días activos en una misma semana. ¡Qué constancia!", rule: { type: "weeklyChallenge" }, shareable: true },
  { id: "diez-dias", emoji: "🏅", title: "Diez días activos", description: "Diez días acompañando tu cuidado, a tu ritmo.", rule: { type: "activeDays", total: 10 }, shareable: true },
  { id: "guardian-vitamina-d", emoji: "🌞", title: "Guardián de la Vitamina D", description: "Aprendiste sobre vitamina D, calcio y el sol, y armaste tu plato.", rule: { type: "learningSet", keys: ["lesson:vitamina-d-y-calcio", "lesson:sol-con-cuidado", "game:arma-tu-plato"] }, shareable: false },
  { id: "experto-densitometria", emoji: "🩻", title: "Experto en Densitometría", description: "Ya sabes qué es la DMO y cómo se lee el T-score.", rule: { type: "learningSet", keys: ["lesson:que-es-la-dmo", "lesson:como-leer-el-t-score"] }, shareable: false },
  { id: "protector-articular", emoji: "🦵", title: "Protector Articular", description: "Conoces la diferencia entre artrosis y artritis y qué dice la rigidez de la mañana.", rule: { type: "learningSet", keys: ["lesson:artrosis-vs-artritis", "lesson:rigidez-matutina", "lesson:crujidos-articulares"] }, shareable: true },
  { id: "hogar-seguro", emoji: "🏠", title: "Hogar sin tropiezos", description: "Aprendiste a cuidar tu casa contra las caídas.", rule: { type: "learningSet", keys: ["lesson:prevencion-de-caidas", "game:casa-segura"] }, shareable: true },
  { id: "mente-curiosa", emoji: "📚", title: "Mente curiosa", description: "Cinco lecciones leídas. Artiko estrena su medalla del saber.", rule: { type: "learningCount", kind: "lesson", total: 5 }, accessory: "medal", shareable: true },
  { id: "jugador-sabio", emoji: "🎮", title: "Jugador sabio", description: "Tres juegos distintos completados, a tu ritmo.", rule: { type: "learningCount", kind: "game", total: 3 }, shareable: true },
];

export const GAME_UNLOCKS: readonly GameUnlock[] = z
  .array(gameUnlockSchema)
  .refine((items) => new Set(items.map((item) => item.id)).size === items.length, { message: "Ids repetidos" })
  .parse(RAW_UNLOCKS);
