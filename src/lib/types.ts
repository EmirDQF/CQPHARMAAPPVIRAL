export type Sex = "femenino" | "masculino";

export type RiskLevel = "bajo" | "moderado" | "alto";

export interface QuestionOption {
  value: string;
  label: string;
  points: number;
}

export interface ScoredQuestion {
  id: string;
  title: string;
  helper: string;
  options: QuestionOption[];
}

export interface AgeSexValue {
  age: number;
  sex: Sex;
}

export type ScoredAnswers = Record<string, string>;

export interface RiskResult {
  chronologicalAge: number;
  articularAge: number;
  riskScore: number;
  riskLevel: RiskLevel;
  label: string;
  emoji: string;
  message: string;
  diagnosticSuggestion: string;
  supplementProtocol: string;
}
