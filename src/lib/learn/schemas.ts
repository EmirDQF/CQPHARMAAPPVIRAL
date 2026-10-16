import { z } from "zod";
import { FORBIDDEN_COPY_PATTERNS, findForbiddenPhrases, type ForbiddenCopyCategory } from "../clinical/forbiddenCopy";

/**
 * Contenido educativo de reumatología como data. Es información general, no
 * diagnóstico ni indicación terapéutica: sin dosis ni cambios de tratamiento.
 * Las fichas sí pueden nombrar nutrientes (calcio, vitamina D), así que se
 * revisan las categorías de cura/reversión y de culpa, no la de ingredientes.
 * Todo el contenido queda `pendiente` hasta que lo valide el médico del
 * proyecto (docs/BLOCKERS.md).
 */
export const CONTENT_SOURCES = ["OMS", "IOF", "ACR", "EULAR", "SER"] as const;
export type ContentSource = (typeof CONTENT_SOURCES)[number];

export const REVIEW_STATUSES = ["pendiente", "validado"] as const;

export const LESSON_TOPICS = [
  "articulaciones",
  "huesos",
  "densitometria",
  "nutricion",
  "movimiento",
  "caidas",
  "consulta",
] as const;
export type LessonTopic = (typeof LESSON_TOPICS)[number];

const MAX_LESSON_MINUTES = 2;
const DOCTOR_QUESTIONS = 3;

/** Todas las categorías salvo la de ingredientes (aquí sí se habla de calcio y vitamina D). */
const LEARN_COPY_CATEGORIES: readonly ForbiddenCopyCategory[] = [
  ...new Set(FORBIDDEN_COPY_PATTERNS.map((rule) => rule.category).filter((category) => category !== "producto-ingrediente")),
];

const copy = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((text) => findForbiddenPhrases(text, { categories: LEARN_COPY_CATEGORIES }).length === 0, {
      message: "Texto con frase prohibida",
    });

const reviewedContent = {
  source: z.enum(CONTENT_SOURCES),
  reviewStatus: z.enum(REVIEW_STATUSES),
};

export const lessonSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{3,40}$/),
  emoji: z.string().min(1).max(8),
  title: copy(60),
  summary: copy(140),
  topic: z.enum(LESSON_TOPICS),
  minutes: z.number().int().min(1).max(MAX_LESSON_MINUTES),
  /** Párrafos breves en lenguaje simple. */
  body: z.array(copy(320)).min(2).max(5),
  keyPoint: copy(160),
  /** "Preguntar a mi médico": tres preguntas para llevar a consulta. */
  doctorQuestions: z.array(copy(140)).length(DOCTOR_QUESTIONS),
  /** Sugiere movimiento físico: se oculta con una bandera roja activa. */
  physical: z.boolean(),
  ...reviewedContent,
});
export type Lesson = z.infer<typeof lessonSchema>;

export const glossaryTermSchema = z.object({
  term: copy(40),
  definition: copy(260),
  ...reviewedContent,
});
export type GlossaryTerm = z.infer<typeof glossaryTermSchema>;

export const alarmSignSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{3,40}$/),
  emoji: z.string().min(1).max(8),
  title: copy(60),
  detail: copy(200),
  ...reviewedContent,
});
export type AlarmSign = z.infer<typeof alarmSignSchema>;

function uniqueBy<T>(key: (item: T) => string, label: string) {
  return (items: readonly T[], context: z.RefinementCtx) => {
    const keys = items.map(key);
    if (new Set(keys).size !== keys.length) context.addIssue({ code: "custom", message: `${label} repetidos` });
  };
}

export const lessonCatalogSchema = z.array(lessonSchema).min(20).superRefine(uniqueBy((lesson: Lesson) => lesson.id, "Ids de lecciones"));
export const glossarySchema = z
  .array(glossaryTermSchema)
  .min(1)
  .superRefine(uniqueBy((item: GlossaryTerm) => item.term.toLowerCase(), "Términos"));
export const alarmSignsSchema = z.array(alarmSignSchema).min(1).superRefine(uniqueBy((item: AlarmSign) => item.id, "Señales"));

export const LEARN_DISCLAIMER =
  "Información general y educativa: no es un diagnóstico ni una indicación de tratamiento. Consulta a tu médico.";
