"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { ChoiceGroup, type ChoiceOption } from "@/components/ui/ChoiceGroup";
import { GameButton } from "@/components/ui/GameButton";
import { MENOPAUSE_UNCERTAIN_NOTE, type MenopausalStatus } from "@/lib/clinical/tScoreEligibility";
import type { ArtikoEmotion } from "@/lib/mascot/mascot";
import {
  EMPTY_PROFILE_DRAFT,
  profileQuestions,
  validateFirstRunAge,
  validateFirstRunName,
  type ProfileDraft,
  type ProfileQuestion,
} from "@/lib/onboarding/onboarding";
import { ArtikoSays } from "./ArtikoSays";

type SexChoice = "femenino" | "masculino" | "no-decir";
type FractureChoice = "si" | "no" | "no-decir";

const SEX_OPTIONS: readonly ChoiceOption<SexChoice>[] = [
  { value: "femenino", label: "Femenino" },
  { value: "masculino", label: "Masculino" },
  { value: "no-decir", label: "Prefiero no decirlo" },
];

const MENOPAUSAL_OPTIONS: readonly ChoiceOption<MenopausalStatus>[] = [
  { value: "posmenopausica", label: "Sí, ya la pasé" },
  { value: "premenopausica", label: "Aún no" },
  { value: "no-segura", label: "No estoy segura" },
  { value: "no-decir", label: "Prefiero no decirlo" },
];

function isUnsureAnswer(status: MenopausalStatus | null): boolean {
  return status === "no-segura" || status === "no-decir";
}

const FRACTURE_OPTIONS: readonly ChoiceOption<FractureChoice>[] = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
  { value: "no-decir", label: "No sé / Prefiero no decirlo" },
];

interface QuestionCopy {
  title: string;
  hint: string;
  emotion: ArtikoEmotion;
}

const QUESTION_COPY: Readonly<Record<ProfileQuestion, QuestionCopy>> = {
  name: { title: "¿Cómo te llamo?", hint: "Tu nombre o apodo, como prefieras.", emotion: "happy" },
  age: {
    title: "¿Cuántos años tienes?",
    hint: "Me ayuda a leer bien tu densitometría. Puedes dejarlo vacío.",
    emotion: "waiting",
  },
  sex: { title: "¿Cuál es tu sexo?", hint: "El Semáforo Óseo usa una regla distinta según el sexo.", emotion: "waiting" },
  menopause: {
    title: "¿Ya pasaste la menopausia?",
    hint: "Define qué regla usa tu médico para leer la densitometría.",
    emotion: "thinking",
  },
  fracture: {
    title: "¿Alguna vez te fracturaste un hueso?",
    hint: "Si fue por una caída leve, cuéntaselo también a tu médico.",
    emotion: "thinking",
  },
};

const INPUT_CLASS =
  "min-h-16 w-full rounded-control border-2 border-line bg-surface px-4 text-2xl aria-[invalid=true]:border-risk-high";

/** Respuestas del perfil; "prefiero no decirlo" se distingue de "aún sin responder" para marcar la opción. */
interface ProfileAnswers {
  sex: SexChoice | null;
  menopausalStatus: MenopausalStatus | null;
  fracture: FractureChoice | null;
}

const EMPTY_ANSWERS: ProfileAnswers = { sex: null, menopausalStatus: null, fracture: null };

function draftFrom(name: string, age: number | null, answers: ProfileAnswers): ProfileDraft {
  const sex = answers.sex === "femenino" || answers.sex === "masculino" ? answers.sex : null;
  return {
    ...EMPTY_PROFILE_DRAFT,
    name,
    age,
    sex,
    menopausalStatus: sex === "femenino" ? answers.menopausalStatus : null,
    hasFractureHistory: answers.fracture === "si" ? true : answers.fracture === "no" ? false : null,
  };
}

function FieldError({ message }: { message: string | null }) {
  return (
    <p id="first-run-error" aria-live="polite" className="text-lg font-bold text-risk-high empty:hidden">
      {message}
    </p>
  );
}

interface ProfileStepProps {
  onSave: (draft: ProfileDraft) => void;
  /** Avisa la pregunta actual para el indicador de avance del flujo. */
  onQuestionChange?: (index: number, total: number) => void;
}

/**
 * Perfil del primer arranque, una pregunta por pantalla (nombre, edad, sexo,
 * menopausia si aplica, fractura). Nada se guarda hasta la última respuesta.
 */
export function ProfileStep({ onSave, onQuestionChange }: ProfileStepProps) {
  const [index, setIndex] = useState(0);
  const [nameInput, setNameInput] = useState("");
  const [ageInput, setAgeInput] = useState("");
  const [answers, setAnswers] = useState<ProfileAnswers>(EMPTY_ANSWERS);
  const [error, setError] = useState<string | null>(null);

  const questions = profileQuestions({ sex: answers.sex === "femenino" ? "femenino" : null });
  const question = questions[index];
  const copy = QUESTION_COPY[question];
  const isLast = index === questions.length - 1;

  function goTo(nextIndex: number) {
    setError(null);
    setIndex(nextIndex);
    onQuestionChange?.(nextIndex, questions.length);
  }

  function validateCurrent(): string | null {
    if (question === "name") {
      const result = validateFirstRunName(nameInput);
      return result.ok ? null : result.error;
    }
    if (question === "age") {
      const result = validateFirstRunAge(ageInput);
      return result.ok ? null : result.error;
    }
    return null;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const fieldError = validateCurrent();
    if (fieldError) {
      setError(fieldError);
      return;
    }
    if (!isLast) {
      goTo(index + 1);
      return;
    }
    const name = validateFirstRunName(nameInput);
    const age = validateFirstRunAge(ageInput);
    onSave(draftFrom(name.ok ? name.value : "", age.ok ? age.value : null, answers));
  }

  let field: ReactNode;
  switch (question) {
    case "name":
      field = (
        <input
          id="first-run-name"
          aria-label={copy.title}
          value={nameInput}
          onChange={(event) => setNameInput(event.target.value)}
          autoComplete="nickname"
          enterKeyHint="next"
          aria-invalid={error !== null}
          aria-describedby="first-run-error"
          className={INPUT_CLASS}
          placeholder="Ej. Rosa"
        />
      );
      break;
    case "age":
      field = (
        <input
          id="first-run-age"
          aria-label={copy.title}
          value={ageInput}
          onChange={(event) => setAgeInput(event.target.value)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={3}
          enterKeyHint="next"
          aria-invalid={error !== null}
          aria-describedby="first-run-error"
          className={INPUT_CLASS}
          placeholder="Ej. 58"
        />
      );
      break;
    case "sex":
      field = (
        <ChoiceGroup
          legend={copy.title}
          isLegendVisuallyHidden
          name="first-run-sex"
          options={SEX_OPTIONS}
          value={answers.sex}
          onChange={(sex) => setAnswers({ ...answers, sex })}
          stacked
        />
      );
      break;
    case "menopause":
      field = (
        <ChoiceGroup
          legend={copy.title}
          isLegendVisuallyHidden
          name="first-run-menopause"
          options={MENOPAUSAL_OPTIONS}
          value={answers.menopausalStatus}
          onChange={(menopausalStatus) => setAnswers({ ...answers, menopausalStatus })}
          stacked
          hint={isUnsureAnswer(answers.menopausalStatus) ? MENOPAUSE_UNCERTAIN_NOTE : undefined}
        />
      );
      break;
    case "fracture":
      field = (
        <ChoiceGroup
          legend={copy.title}
          isLegendVisuallyHidden
          name="first-run-fracture"
          options={FRACTURE_OPTIONS}
          value={answers.fracture}
          onChange={(fracture) => setAnswers({ ...answers, fracture })}
          stacked
        />
      );
      break;
  }

  return (
    <form key={question} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <ArtikoSays emotion={copy.emotion} hint={copy.hint}>
        {copy.title}
      </ArtikoSays>
      {field}
      <FieldError message={error} />
      <GameButton type="submit" tone="vital" size="xl" block>
        {isLast ? "Guardar y seguir" : "Siguiente"}
      </GameButton>
      {index > 0 && (
        <GameButton tone="surface" size="lg" block haptic={false} onClick={() => goTo(index - 1)}>
          Atrás
        </GameButton>
      )}
    </form>
  );
}
