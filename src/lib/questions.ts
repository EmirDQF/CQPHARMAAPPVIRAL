import type { ScoredQuestion } from "./types";

/**
 * Las 6 preguntas clínicas puntuables del Test de Edad Articular
 * (la 7ma pregunta del blueprint, edad + sexo, se captura por separado
 * en el primer paso del test).
 */
export const scoredQuestions: ScoredQuestion[] = [
  {
    id: "rigidezMatutina",
    title:
      "¿Sientes rigidez o dificultad para doblar las rodillas al levantarte de la cama?",
    helper: "Prueba funcional matutina",
    options: [
      { value: "no", label: "No, me muevo con normalidad", points: 0 },
      { value: "leve", label: "A veces, dura menos de 15 minutos", points: 1 },
      { value: "severa", label: "Sí, dura más de 15 minutos", points: 3 },
    ],
  },
  {
    id: "crujidos",
    title:
      "¿Tus rodillas o caderas hacen chasquidos o crujidos audibles al subir o bajar escaleras?",
    helper: "Prueba de crujido articular",
    options: [
      { value: "nunca", label: "Nunca", points: 0 },
      { value: "ocasional", label: "Ocasionalmente", points: 1 },
      { value: "frecuente", label: "Frecuentemente", points: 2 },
    ],
  },
  {
    id: "fuerzaMovilidad",
    title:
      "¿Te cuesta abrir frascos nuevos o levantarte de una silla sin apoyarte en los brazos?",
    helper: "Fuerza y movilidad",
    options: [
      { value: "no", label: "No, tengo fuerza normal", points: 0 },
      { value: "a_veces", label: "A veces me cuesta", points: 2 },
      { value: "frecuente", label: "Sí, me cuesta con frecuencia", points: 3 },
    ],
  },
  {
    id: "antecedentesFamiliares",
    title:
      "¿Tu madre, abuela o padre sufrieron fractura de cadera o pérdida visible de estatura?",
    helper: "Genética y antecedentes",
    options: [
      { value: "no", label: "No, sin antecedentes conocidos", points: 0 },
      { value: "no_seguro", label: "No estoy seguro/a", points: 1 },
      { value: "si", label: "Sí, hay antecedentes familiares", points: 4 },
    ],
  },
  {
    id: "nutricionMineral",
    title:
      "¿Tomas sol 15 minutos diarios y consumes magnesio/calcio en tu dieta regular?",
    helper: "Nutrición mineral",
    options: [
      { value: "si", label: "Sí, regularmente", points: -2 },
      { value: "a_veces", label: "A veces", points: 0 },
      { value: "casi_nunca", label: "Casi nunca", points: 2 },
    ],
  },
  {
    id: "habitosImpacto",
    title:
      "¿Realizas actividad física de fuerza o pasas más de 6 horas sentado al día?",
    helper: "Hábitos de impacto",
    options: [
      {
        value: "fuerza",
        label: "Hago ejercicio de fuerza regularmente",
        points: -2,
      },
      {
        value: "movimiento",
        label: "Camino o me muevo, sin rutina de fuerza",
        points: 0,
      },
      {
        value: "sedentario",
        label: "Paso más de 6 horas sentado y no hago ejercicio",
        points: 3,
      },
    ],
  },
];

export const TOTAL_STEPS = scoredQuestions.length + 1;
