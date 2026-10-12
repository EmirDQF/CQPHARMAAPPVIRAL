import { z } from "zod";
import { findForbiddenPhrases } from "../clinical/forbiddenCopy";

/**
 * Actividades diarias de Artiko como data. Agregar una = añadir un objeto en
 * catalog.ts; Zod rechaza ids repetidos, frases prohibidas (todas las
 * categorías: cura, ingredientes, culpa) y actividades físicas sin pasos.
 */
export const ACTIVITY_CATEGORIES = ["registro", "cuerpo", "habitos", "mente", "social"] as const;
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

/**
 * - check-in / dose: se completan con el chequeo y el pastillero existentes.
 * - guided: pasos con cuenta regresiva que guía Artiko.
 * - self-report: "Lo hice" (autorreporte, sin valores).
 * - quiz: micro-lección o mito vs. evidencia con una pregunta.
 * - share: abre compartir (sin datos de salud).
 */
export const ACTIVITY_KINDS = ["check-in", "dose", "guided", "self-report", "quiz", "share"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

/** `physical` = lleva descargo y se oculta con bandera roja. */
export const SAFETY_TAGS = ["none", "physical"] as const;

const MAX_XP = 50;
const MAX_MINUTES = 30;
const MAX_STEP_SECONDS = 180;

const copy = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((text) => findForbiddenPhrases(text).length === 0, { message: "Texto con frase prohibida" });

export const guidedStepSchema = z.object({ text: copy(120), seconds: z.number().int().min(5).max(MAX_STEP_SECONDS) });
export type GuidedStep = z.infer<typeof guidedStepSchema>;

export const quizSchema = z
  .object({
    question: copy(140),
    options: z.array(copy(80)).min(2).max(4),
    answerIndex: z.number().int().min(0),
    explanation: copy(240),
    /** Artículo del blog que respalda la explicación (src/lib/articles.ts). */
    articleSlug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  })
  .refine((quiz) => quiz.answerIndex < quiz.options.length, { message: "Respuesta fuera de rango" });
export type Quiz = z.infer<typeof quizSchema>;

export const activitySchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{3,40}$/),
    emoji: z.string().min(1).max(8),
    title: copy(40),
    description: copy(160),
    category: z.enum(ACTIVITY_CATEGORIES),
    kind: z.enum(ACTIVITY_KINDS),
    durationMinutes: z.number().int().min(1).max(MAX_MINUTES),
    xp: z.number().int().min(1).max(MAX_XP),
    safety: z.enum(SAFETY_TAGS),
    /** Requiere visto bueno médico: no aparece hasta que exista ese flujo. */
    requiresClearance: z.boolean(),
    /** Siempre en la lista del día (registro clínico básico). */
    core: z.boolean(),
    /** Solo para `dose`: id de DOSE_SCHEDULE. */
    doseId: z.string().optional(),
    steps: z.array(guidedStepSchema).optional(),
    quiz: quizSchema.optional(),
  })
  .refine((activity) => activity.kind !== "guided" || (activity.steps?.length ?? 0) > 0, { message: "Actividad guiada sin pasos" })
  .refine((activity) => activity.kind !== "quiz" || activity.quiz !== undefined, { message: "Quiz sin pregunta" })
  .refine((activity) => activity.kind !== "dose" || activity.doseId !== undefined, { message: "Toma sin doseId" })
  .refine((activity) => activity.category !== "cuerpo" || activity.safety === "physical", {
    message: "Toda actividad de cuerpo es física",
  });
export type Activity = z.infer<typeof activitySchema>;

export const activityCatalogSchema = z
  .array(activitySchema)
  .min(1)
  .refine((items) => new Set(items.map((item) => item.id)).size === items.length, { message: "Ids repetidos" });
