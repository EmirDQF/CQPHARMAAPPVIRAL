import { scoredQuestions } from "./questions";
import type { AgeSexValue, RiskResult, ScoredAnswers } from "./types";

const MIN_ARTICULAR_AGE_OFFSET = -5;

const FEMALE_POST_MENOPAUSE_AGE = 45;
const FEMALE_POST_MENOPAUSE_POINTS = 2;

function sumAnswerPoints(answers: ScoredAnswers): number {
  return scoredQuestions.reduce((total, question) => {
    const selectedValue = answers[question.id];
    const option = question.options.find((o) => o.value === selectedValue);
    return total + (option?.points ?? 0);
  }, 0);
}

export function calculateRisk(
  ageSex: AgeSexValue,
  answers: ScoredAnswers
): RiskResult {
  const { age, sex } = ageSex;

  let riskScore = sumAnswerPoints(answers);
  if (sex === "femenino" && age >= FEMALE_POST_MENOPAUSE_AGE) {
    riskScore += FEMALE_POST_MENOPAUSE_POINTS;
  }

  const articularAge = Math.max(
    age + MIN_ARTICULAR_AGE_OFFSET,
    Math.round(age + riskScore)
  );

  if (riskScore <= 1) {
    return {
      chronologicalAge: age,
      articularAge,
      riskScore,
      riskLevel: "bajo",
      label: "RIESGO BAJO",
      emoji: "🟩",
      message:
        "Tus articulaciones y huesos muestran buena salud general. La prevención es tu mejor aliada para mantener esta condición a largo plazo.",
      diagnosticSuggestion: "Densitometría Ósea de Mantenimiento",
      supplementProtocol: "Nutrición Celular: Protocolo Colágeno + Vitamina C",
    };
  }

  if (riskScore <= 7) {
    return {
      chronologicalAge: age,
      articularAge,
      riskScore,
      riskLevel: "moderado",
      label: "RIESGO MODERADO",
      emoji: "🟨",
      message:
        "Detectamos señales de desmineralización y rigidez matutina. Recuerda: la pérdida ósea no avisa con dolor, avisa con fracturas.",
      diagnosticSuggestion: "Densitometría Ósea Preventiva",
      supplementProtocol: "Nutrición Celular: Protocolo Citrato de Magnesio + D3",
    };
  }

  return {
    chronologicalAge: age,
    articularAge,
    riskScore,
    riskLevel: "alto",
    label: "RIESGO ALTO",
    emoji: "🟥",
    message:
      "Tus respuestas indican señales importantes de desgaste articular y riesgo óseo. Te recomendamos una evaluación médica cuanto antes.",
    diagnosticSuggestion: "Densitometría Ósea + Lectura Médica Preventiva",
    supplementProtocol: "Pack Hueso Fuerte 360: Citrato de Magnesio + D3 + Zinc",
  };
}
