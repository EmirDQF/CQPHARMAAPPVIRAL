"use client";

import { useState, type FormEvent } from "react";
import { ChoiceGroup, type ChoiceOption } from "@/components/ui/ChoiceGroup";
import { GameButton } from "@/components/ui/GameButton";
import type { MenopausalStatus } from "@/lib/clinical/tScoreEligibility";
import { validateProfileStep, type ProfileStepResult, type ProfileStepValue } from "@/lib/onboarding/onboarding";
import { toLimaIsoDate } from "@/lib/utils/date";
import { StepHeading } from "./StepHeading";

type SexChoice = "femenino" | "masculino" | "no-decir";

const SEX_OPTIONS: readonly ChoiceOption<SexChoice>[] = [
  { value: "femenino", label: "Femenino" },
  { value: "masculino", label: "Masculino" },
  { value: "no-decir", label: "Prefiero no decirlo" },
];

const MENOPAUSAL_OPTIONS: readonly ChoiceOption<MenopausalStatus>[] = [
  { value: "posmenopausica", label: "Ya pasé la menopausia" },
  { value: "premenopausica", label: "Aún no" },
  { value: "no-aplica", label: "No sé / Prefiero no decirlo" },
];

const INPUT_CLASS = "min-h-14 rounded-2xl border-2 border-line bg-surface px-4 text-xl aria-[invalid=true]:border-risk-high";

type FieldErrors = Extract<ProfileStepResult, { ok: false }>["errors"];

function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <p id={id} aria-live="polite" className="text-base font-bold text-risk-high empty:hidden">
      {message}
    </p>
  );
}

/** Perfil mínimo del primer arranque (validación Zod, errores amables, solo se guarda la edad). */
export function ProfileStep({ onSave }: { onSave: (value: ProfileStepValue) => void }) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState<SexChoice | null>(null);
  const [menopausalStatus, setMenopausalStatus] = useState<MenopausalStatus | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = validateProfileStep({
      name,
      birthDate,
      sex: sex === "femenino" || sex === "masculino" ? sex : null,
      menopausalStatus,
    });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onSave(result.value);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <StepHeading>Cuéntame de ti 😊</StepHeading>
      <div className="flex flex-col gap-2">
        <label htmlFor="first-run-name" className="text-lg font-bold">¿Cómo te llamo?</label>
        <input
          id="first-run-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="nickname"
          aria-invalid={errors.name !== undefined}
          aria-describedby="first-run-name-error"
          className={INPUT_CLASS}
          placeholder="Ej. Rosa"
        />
        <FieldError id="first-run-name-error" message={errors.name} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="first-run-birth" className="text-lg font-bold">Fecha de nacimiento (opcional)</label>
        <span id="first-run-birth-hint" className="text-base text-muted">
          Solo guardamos tu edad. El Semáforo Óseo depende de la edad y el sexo; si prefieres no decirlo, déjalo vacío.
        </span>
        <input
          id="first-run-birth"
          type="date"
          value={birthDate}
          max={toLimaIsoDate()}
          onChange={(event) => setBirthDate(event.target.value)}
          aria-invalid={errors.birthDate !== undefined}
          aria-describedby="first-run-birth-hint first-run-birth-error"
          className={INPUT_CLASS}
        />
        <FieldError id="first-run-birth-error" message={errors.birthDate} />
      </div>
      <ChoiceGroup legend="Sexo" name="first-run-sex" options={SEX_OPTIONS} value={sex} onChange={setSex} stacked />
      {sex === "femenino" && (
        <ChoiceGroup
          legend="¿Ya pasaste la menopausia?"
          hint="Define qué regla usa tu médico para leer la densitometría."
          name="first-run-menopause"
          options={MENOPAUSAL_OPTIONS}
          value={menopausalStatus}
          onChange={setMenopausalStatus}
          stacked
        />
      )}
      <GameButton type="submit" tone="vital" size="xl" block>
        Guardar y seguir
      </GameButton>
    </form>
  );
}
