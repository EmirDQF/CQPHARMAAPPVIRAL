import { z } from "zod";
import { findForbiddenPhrases } from "../clinical/forbiddenCopy";

/**
 * Recompensas por CONSTANCIA (nunca por resultados clínicos ni compras). El
 * catálogo es data: agregar o editar un logro = editar catalog.ts (o, más
 * adelante, la fuente remota) sin tocar componentes. Todo se valida aquí.
 */
const MAX_RULE_DAYS = 366;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const daysSchema = z.number().int().min(1).max(MAX_RULE_DAYS);

export const unlockRuleSchema = z.discriminatedUnion("type", [
  /** Racha vigente de días completos (con días de gracia). */
  z.object({ type: z.literal("streak"), days: daysSchema }),
  /** Días completos acumulados: nunca se pierden. */
  z.object({ type: z.literal("completeDays"), total: daysSchema }),
  /** La racha más larga lograda alguna vez (p. ej. primera semana completa). */
  z.object({ type: z.literal("longestRun"), days: daysSchema }),
  /** Días con chequeo de dolor/rigidez acumulados (el valor registrado no importa). */
  z.object({ type: z.literal("checkInDays"), total: daysSchema }),
  /** Primer chequeo de cada mes: se desbloquea una vez por mes. */
  z.object({ type: z.literal("monthlyCheckIn") }),
  /** Completar un día tras una pausa de al menos `gapDays` días. */
  z.object({ type: z.literal("returnAfterBreak"), gapDays: daysSchema }),
]);
export type UnlockRule = z.infer<typeof unlockRuleSchema>;

export const REWARD_ILLUSTRATIONS = ["sprout", "sun", "moon", "star", "heart", "mountain", "calendar", "hands"] as const;
export const REWARD_TONES = ["mint", "sky", "lavender", "peach", "rose", "lemon"] as const;

const copySchema = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((text) => findForbiddenPhrases(text).length === 0, { message: "Texto con frase prohibida" });

export const rewardDefinitionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{3,40}$/),
  title: copySchema(40),
  description: copySchema(140),
  rule: unlockRuleSchema,
  illustration: z.enum(REWARD_ILLUSTRATIONS),
  tone: z.enum(REWARD_TONES),
});
export type RewardDefinition = z.infer<typeof rewardDefinitionSchema>;

export const rewardCatalogSchema = z
  .array(rewardDefinitionSchema)
  .min(1)
  .refine((rewards) => new Set(rewards.map((reward) => reward.id)).size === rewards.length, {
    message: "Ids de logros repetidos",
  });

export const REWARD_PROGRESS_VERSION = 1;

export const unlockedRewardSchema = z.object({
  rewardId: z.string(),
  /** id, o id:YYYY-MM para los mensuales: hace idempotente el desbloqueo. */
  key: z.string(),
  unlockedOn: z.string().regex(ISO_DATE),
});
export type UnlockedReward = z.infer<typeof unlockedRewardSchema>;

/** Lo que se guarda en artikare_rewards_v1 (local, sin datos clínicos). */
export const rewardProgressSchema = z.object({
  version: z.literal(REWARD_PROGRESS_VERSION),
  unlocked: z.array(unlockedRewardSchema),
  /** Claves ya celebradas: la celebración sale una sola vez. */
  celebratedKeys: z.array(z.string()),
});
export type RewardProgress = z.infer<typeof rewardProgressSchema>;

export const EMPTY_REWARD_PROGRESS: RewardProgress = { version: REWARD_PROGRESS_VERSION, unlocked: [], celebratedKeys: [] };
