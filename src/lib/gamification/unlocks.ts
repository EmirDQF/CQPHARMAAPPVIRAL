import { z } from "zod";
import { findForbiddenPhrases } from "../clinical/forbiddenCopy";
import { ARTIKO_ACCESSORIES } from "../mascot/mascot";
import { ACTIVITY_CATEGORIES } from "../activities/schemas";

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
]);
export type GameRule = z.infer<typeof gameRuleSchema>;

const copy = (max: number) =>
  z.string().trim().min(1).max(max).refine((text) => findForbiddenPhrases(text).length === 0, { message: "Frase prohibida" });

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
];

export const GAME_UNLOCKS: readonly GameUnlock[] = z
  .array(gameUnlockSchema)
  .refine((items) => new Set(items.map((item) => item.id)).size === items.length, { message: "Ids repetidos" })
  .parse(RAW_UNLOCKS);
