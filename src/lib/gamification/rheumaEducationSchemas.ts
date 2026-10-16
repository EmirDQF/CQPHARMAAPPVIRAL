import { z } from "zod";
import { FORBIDDEN_COPY_PATTERNS, findForbiddenPhrases, type ForbiddenCopyCategory } from "../clinical/forbiddenCopy";
import { CONTENT_SOURCES, REVIEW_STATUSES } from "../learn/schemas";

/**
 * Esquemas de los mini-juegos educativos. Cada ítem trae una explicación
 * breve y su `source` general; todo queda `pendiente` de validación médica.
 * Se permite nombrar nutrientes (calcio, vitamina D) pero no prometer cura.
 */
const GAME_COPY_CATEGORIES: readonly ForbiddenCopyCategory[] = [
  ...new Set(FORBIDDEN_COPY_PATTERNS.map((rule) => rule.category).filter((category) => category !== "producto-ingrediente")),
];

const copy = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((text) => findForbiddenPhrases(text, { categories: GAME_COPY_CATEGORIES }).length === 0, {
      message: "Texto con frase prohibida",
    });

const reviewed = {
  explanation: copy(220),
  source: z.enum(CONTENT_SOURCES),
  reviewStatus: z.enum(REVIEW_STATUSES),
};

export const mythItemSchema = z.object({ id: z.string().min(3), statement: copy(140), isFact: z.boolean(), ...reviewed });
export type MythItem = z.infer<typeof mythItemSchema>;

export const SHIELD_GROUPS = ["cuida", "consulta", "no-ayuda"] as const;
export type ShieldGroup = (typeof SHIELD_GROUPS)[number];
export const shieldItemSchema = z.object({
  id: z.string().min(3),
  emoji: z.string().min(1).max(8),
  label: copy(80),
  group: z.enum(SHIELD_GROUPS),
  ...reviewed,
});
export type ShieldItem = z.infer<typeof shieldItemSchema>;

export const PLATE_NUTRIENTS = ["calcio", "vitamina-d", "ambos", "poco"] as const;
export const plateItemSchema = z.object({
  id: z.string().min(3),
  emoji: z.string().min(1).max(8),
  name: copy(40),
  nutrient: z.enum(PLATE_NUTRIENTS),
  ...reviewed,
});
export type PlateItem = z.infer<typeof plateItemSchema>;

const PERCENT = z.number().min(0).max(100);
export const homeSpotSchema = z.object({
  id: z.string().min(3),
  label: copy(60),
  isRisk: z.boolean(),
  /** Posición del punto en la ilustración, en % del ancho y alto. */
  x: PERCENT,
  y: PERCENT,
  ...reviewed,
});
export type HomeSpot = z.infer<typeof homeSpotSchema>;

export const memoryPairSchema = z.object({ id: z.string().min(3), term: copy(30), match: copy(60), ...reviewed });
export type MemoryPair = z.infer<typeof memoryPairSchema>;

export const QUIZ_LEVELS = [1, 2, 3] as const;
export const quizItemSchema = z
  .object({
    id: z.string().min(3),
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    question: copy(140),
    options: z.array(copy(80)).min(2).max(4),
    answerIndex: z.number().int().min(0),
    ...reviewed,
  })
  .refine((item) => item.answerIndex < item.options.length, { message: "Respuesta fuera de rango" });
export type QuizItem = z.infer<typeof quizItemSchema>;

function uniqueIds<T extends { id: string }>(schema: z.ZodType<T>, min: number) {
  return z
    .array(schema)
    .min(min)
    .refine((items) => new Set(items.map((item) => item.id)).size === items.length, { message: "Ids repetidos" });
}

export const rheumaEducationSchema = z.object({
  myths: uniqueIds(mythItemSchema, 10),
  shield: uniqueIds(shieldItemSchema, 9),
  plate: uniqueIds(plateItemSchema, 10),
  home: uniqueIds(homeSpotSchema, 8),
  memory: uniqueIds(memoryPairSchema, 6),
  quiz: uniqueIds(quizItemSchema, 12),
});
export type RheumaEducation = z.infer<typeof rheumaEducationSchema>;
