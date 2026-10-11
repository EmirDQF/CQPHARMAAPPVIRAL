import { rewardCatalogSchema, type RewardDefinition } from "./schemas";

/**
 * Catálogo de logros por constancia. Para agregar uno: añade un objeto aquí
 * (id único, título, descripción, regla, ilustración y tono) y corre
 * `npx vitest run src/lib/rewards`. Se valida con Zod al cargar el módulo:
 * un id repetido, una regla inválida o una frase prohibida rompe el arranque
 * y los tests, nunca la pantalla del paciente. Ver docs/DESIGN.md.
 *
 * Reglas de copy: reconocer la constancia ("acompaña", "apoya"), nunca un
 * resultado clínico, una compra ni culpa por pausas.
 */
const RAW_CATALOG: readonly RewardDefinition[] = [
  {
    id: "primer-dia",
    title: "Primer día completo",
    description: "Anotaste todas tus tomas de un día. Cada paso cuenta.",
    rule: { type: "completeDays", total: 1 },
    illustration: "sprout",
    tone: "mint",
  },
  {
    id: "racha-3",
    title: "Tres días seguidos",
    description: "Tres días acompañando tu cuidado diario.",
    rule: { type: "streak", days: 3 },
    illustration: "sun",
    tone: "lemon",
  },
  {
    id: "primera-semana",
    title: "Primera semana completa",
    description: "Siete días seguidos cuidándote. Tu constancia apoya tu bienestar.",
    rule: { type: "longestRun", days: 7 },
    illustration: "star",
    tone: "sky",
  },
  {
    id: "racha-14",
    title: "Dos semanas de constancia",
    description: "Catorce días seguidos dedicándote un momento.",
    rule: { type: "streak", days: 14 },
    illustration: "heart",
    tone: "rose",
  },
  {
    id: "racha-30",
    title: "Un mes de constancia",
    description: "Treinta días seguidos. Un hábito que acompaña tu tratamiento.",
    rule: { type: "streak", days: 30 },
    illustration: "mountain",
    tone: "lavender",
  },
  {
    id: "dias-20",
    title: "20 días de cuidado",
    description: "Veinte días completos en total. Ninguno se borra, aunque hagas pausas.",
    rule: { type: "completeDays", total: 20 },
    illustration: "calendar",
    tone: "peach",
  },
  {
    id: "chequeo-del-mes",
    title: "Chequeo del mes",
    description: "Hiciste tu primer chequeo de este mes. Anotar cómo te sientes ayuda a conversar con tu médico.",
    rule: { type: "monthlyCheckIn" },
    illustration: "moon",
    tone: "sky",
  },
  {
    id: "chequeos-10",
    title: "10 chequeos anotados",
    description: "Diez días contándonos cómo amanecieron tus articulaciones.",
    rule: { type: "checkInDays", total: 10 },
    illustration: "star",
    tone: "lavender",
  },
  {
    id: "de-vuelta",
    title: "Qué bueno verte de nuevo",
    description: "Retomaste tu cuidado después de una pausa. Cuidarte a tu ritmo también es cuidarte.",
    rule: { type: "returnAfterBreak", gapDays: 2 },
    illustration: "hands",
    tone: "peach",
  },
];

export const REWARD_CATALOG: readonly RewardDefinition[] = rewardCatalogSchema.parse(RAW_CATALOG);
