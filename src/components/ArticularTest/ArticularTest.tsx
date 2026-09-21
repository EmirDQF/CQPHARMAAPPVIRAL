"use client";

import { useState } from "react";
import { ProgressBar } from "./ProgressBar";
import { QuestionStep } from "./QuestionStep";
import { ResultCard } from "./ResultCard";
import { calculateRisk } from "@/lib/calculateRisk";
import { registerLeadForAnalytics } from "@/lib/api/registerLead";
import { scoredQuestions, TOTAL_STEPS } from "@/lib/questions";
import type { AgeSexValue, RiskResult, ScoredAnswers, Sex } from "@/lib/types";

type Phase = "intro" | "test" | "result";

const MIN_AGE = 18;
const MAX_AGE = 100;

export function ArticularTest() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [step, setStep] = useState(0); // 0 = edad/sexo, 1..N = scoredQuestions
  const [ageInput, setAgeInput] = useState("");
  const [sex, setSex] = useState<Sex | null>(null);
  const [answers, setAnswers] = useState<ScoredAnswers>({});
  const [result, setResult] = useState<RiskResult | null>(null);

  function handleAgeSexNext() {
    const age = Number(ageInput);
    const isValidAge =
      ageInput !== "" && !Number.isNaN(age) && age >= MIN_AGE && age <= MAX_AGE;
    if (!sex || !isValidAge) return;
    setStep(1);
  }

  function handleAnswerSelect(questionId: string, value: string) {
    const nextAnswers = { ...answers, [questionId]: value };
    setAnswers(nextAnswers);

    const isLastQuestion = step === scoredQuestions.length;
    if (isLastQuestion) {
      const ageSex: AgeSexValue = { age: Number(ageInput), sex: sex as Sex };
      const riskResult = calculateRisk(ageSex, nextAnswers);
      registerLeadForAnalytics(riskResult);
      setResult(riskResult);
      setPhase("result");
      return;
    }
    setStep((prev) => prev + 1);
  }

  function handleBack() {
    setStep((prev) => Math.max(0, prev - 1));
  }

  function handleRestart() {
    setPhase("intro");
    setStep(0);
    setAgeInput("");
    setSex(null);
    setAnswers({});
    setResult(null);
  }

  if (phase === "intro") {
    return (
      <div className="w-full max-w-md mx-auto text-center flex flex-col gap-4 items-center">
        <h2 className="text-2xl font-bold">
          Test de Edad Articular y Salud Ósea
        </h2>
        <p className="text-neutral-600 dark:text-neutral-300">
          7 preguntas clínicas rápidas. Descubre en 2 minutos si tu edad
          articular coincide con tu edad real.
        </p>
        <button
          type="button"
          onClick={() => setPhase("test")}
          className="rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-3 transition-colors"
        >
          Evaluar mi Salud Ósea Gratis
        </button>
      </div>
    );
  }

  if (phase === "result" && result) {
    return <ResultCard result={result} onRestart={handleRestart} />;
  }

  const currentQuestion = step > 0 ? scoredQuestions[step - 1] : null;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6">
      <ProgressBar currentStep={step + 1} totalSteps={TOTAL_STEPS} />

      {step === 0 ? (
        <fieldset className="flex flex-col gap-5">
          <div>
            <legend className="text-sm font-medium text-brand mb-1">
              Datos generales
            </legend>
            <p className="text-xl font-semibold">
              ¿Cuál es tu edad y sexo biológico?
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="age" className="text-sm font-medium">
              Edad
            </label>
            <input
              id="age"
              type="number"
              inputMode="numeric"
              min={MIN_AGE}
              max={MAX_AGE}
              value={ageInput}
              onChange={(e) => setAgeInput(e.target.value)}
              placeholder="Ej. 52"
              className="w-full rounded-xl border-2 border-neutral-200 dark:border-neutral-700 px-4 py-3 focus:border-brand outline-none bg-transparent"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Sexo biológico</span>
            <div className="flex gap-3" role="radiogroup">
              {(["femenino", "masculino"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={sex === option}
                  onClick={() => setSex(option)}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 capitalize transition-colors ${
                    sex === option
                      ? "border-brand bg-brand-light text-brand-dark"
                      : "border-neutral-200 dark:border-neutral-700 hover:border-brand/50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAgeSexNext}
            disabled={!ageInput || !sex}
            className="w-full rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 transition-colors"
          >
            Siguiente
          </button>
        </fieldset>
      ) : (
        currentQuestion && (
          <QuestionStep
            question={currentQuestion}
            selectedValue={answers[currentQuestion.id]}
            onSelect={(value) => handleAnswerSelect(currentQuestion.id, value)}
          />
        )
      )}

      {step > 0 && (
        <button
          type="button"
          onClick={handleBack}
          className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 self-start"
        >
          ← Atrás
        </button>
      )}
    </div>
  );
}
