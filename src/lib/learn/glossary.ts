import { alarmSignsSchema, glossarySchema, type AlarmSign, type ContentSource, type GlossaryTerm } from "./schemas";

/**
 * Glosario y señales de alarma de "Aprender". Definiciones generales en
 * lenguaje simple, pendientes de validación del médico del proyecto.
 */
const term = (name: string, definition: string, source: ContentSource): GlossaryTerm => ({
  term: name,
  definition,
  source,
  reviewStatus: "pendiente",
});

const RAW_GLOSSARY: readonly GlossaryTerm[] = [
  term("Ácido úrico", "Sustancia que el cuerpo produce al procesar algunos alimentos. En exceso puede formar cristales en las articulaciones y causar gota.", "ACR"),
  term("Artritis", "Inflamación de una o varias articulaciones: puede haber dolor, hinchazón, calor y rigidez.", "ACR"),
  term("Artritis reumatoide", "Enfermedad autoinmune que inflama las articulaciones, sobre todo de manos y pies, en ambos lados del cuerpo.", "EULAR"),
  term("Artrosis", "Desgaste del cartílago de las articulaciones. También se llama osteoartrosis u osteoartritis.", "ACR"),
  term("Articulación", "Unión entre dos huesos que permite el movimiento, como la rodilla, la cadera o los dedos.", "ACR"),
  term("Cartílago", "Tejido liso y flexible que cubre los extremos de los huesos dentro de la articulación.", "ACR"),
  term("Columna lumbar", "Parte baja de la espalda. Es una de las zonas que mide la densitometría.", "IOF"),
  term("Corticoides", "Medicamentos antiinflamatorios. Usados por mucho tiempo pueden afectar los huesos; nunca los suspendas sin indicación médica.", "IOF"),
  term("Cuello femoral", "Parte superior del hueso del muslo, cerca de la cadera. Es otra zona que mide la densitometría.", "IOF"),
  term("Densitometría ósea", "Examen rápido e indoloro que mide la densidad mineral de los huesos (DMO).", "IOF"),
  term("DMO", "Densidad mineral ósea: cuánto mineral tiene el hueso. Se mide con la densitometría.", "IOF"),
  term("Fibromialgia", "Condición con dolor generalizado, cansancio y un sueño que no deja descansar, que no daña las articulaciones.", "EULAR"),
  term("Fractura por fragilidad", "Fractura que ocurre con un golpe o caída leve, como caerse desde la propia altura.", "IOF"),
  term("Gota", "Artritis causada por cristales de ácido úrico. Suele empezar de golpe, a menudo en el dedo gordo del pie.", "ACR"),
  term("Lumbalgia", "Dolor en la parte baja de la espalda. Es muy frecuente y suele mejorar en semanas.", "OMS"),
  term("Menopausia", "Fin de las menstruaciones. Después de ella baja el estrógeno y la pérdida de hueso puede acelerarse.", "IOF"),
  term("Osteopenia", "Densidad ósea más baja de lo normal, sin llegar a osteoporosis: T-score por debajo de -1.0 y por encima de -2.5.", "OMS"),
  term("Osteoporosis", "Enfermedad que vuelve frágiles los huesos. En la densitometría corresponde a un T-score de -2.5 o menos.", "OMS"),
  term("Reumatólogo", "Médico especialista en enfermedades de las articulaciones, los huesos, los músculos y autoinmunes.", "SER"),
  term("Rigidez matutina", "Sensación de articulaciones duras al despertar. Su duración ayuda al médico a orientar el diagnóstico.", "EULAR"),
  term("T-score", "Número que compara tu densidad ósea con la de un adulto joven sano. Se usa en mujeres posmenopáusicas y hombres de 50 años o más.", "OMS"),
  term("Vitamina D", "Vitamina que ayuda al cuerpo a aprovechar el calcio. La piel la produce con el sol y también está en algunos alimentos.", "IOF"),
  term("Z-score", "Número que compara tu densidad ósea con la de personas de tu misma edad y sexo. Se usa en personas más jóvenes.", "IOF"),
];

export const GLOSSARY: readonly GlossaryTerm[] = glossarySchema.parse(RAW_GLOSSARY);

const sign = (id: string, emoji: string, title: string, detail: string, source: ContentSource): AlarmSign => ({
  id,
  emoji,
  title,
  detail,
  source,
  reviewStatus: "pendiente",
});

const RAW_ALARM_SIGNS: readonly AlarmSign[] = [
  sign("articulacion-caliente", "🔥", "Articulación caliente e hinchada", "Sobre todo si aparece de golpe, sin un golpe previo, o viene con fiebre.", "SER"),
  sign("rigidez-prolongada", "⏳", "Rigidez de la mañana prolongada", "Articulaciones duras al despertar por más de media hora, varios días seguidos.", "EULAR"),
  sign("dolor-nocturno", "🌙", "Dolor que te despierta en la noche", "Un dolor que no calma con el reposo y te quita el sueño.", "SER"),
  sign("perdida-de-estatura", "📏", "Pérdida de estatura", "Notar que estás más bajo o que tu espalda se encorva.", "IOF"),
  sign("fractura-golpe-leve", "🦴", "Fractura con un golpe leve", "Romperse un hueso con una caída desde tu propia altura o menos.", "IOF"),
  sign("dolor-con-alarma", "🚨", "Dolor de espalda con otras señales", "Con fiebre, debilidad o adormecimiento en las piernas, o problemas para orinar: consulta pronto.", "OMS"),
];

export const ALARM_SIGNS: readonly AlarmSign[] = alarmSignsSchema.parse(RAW_ALARM_SIGNS);

/** Búsqueda sin tildes ni mayúsculas en término y definición. */
export function searchGlossary(query: string, glossary: readonly GlossaryTerm[] = GLOSSARY): readonly GlossaryTerm[] {
  const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
  const needle = normalize(query);
  if (!needle) return glossary;
  return glossary.filter((item) => normalize(`${item.term} ${item.definition}`).includes(needle));
}
