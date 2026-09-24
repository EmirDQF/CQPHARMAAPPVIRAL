"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { ConsentCheckbox } from "@/components/privacy/ConsentCheckbox";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { parseProfileAgeInput, patientProfileStore } from "@/lib/dashboard/patientProfile";
import { createConsentRecord, isConsentCurrent } from "@/lib/privacy/consent";
import type { MenopausalStatus } from "@/lib/clinical/tScoreEligibility";
import type { Sex } from "@/lib/types";

type FractureAnswer = "si" | "no";

interface ChoiceOption<T extends string> {
  value: T;
  label: string;
}

const SEX_OPTIONS: ChoiceOption<Sex>[] = [
  { value: "femenino", label: "Femenino" },
  { value: "masculino", label: "Masculino" },
];

const FRACTURE_OPTIONS: ChoiceOption<FractureAnswer>[] = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
];

const MENOPAUSAL_OPTIONS: ChoiceOption<MenopausalStatus>[] = [
  { value: "premenopausica", label: "Premenopáusica" },
  { value: "posmenopausica", label: "Posmenopáusica" },
  { value: "no-aplica", label: "No aplica / No sé" },
];

interface ChoiceGroupProps<T extends string> {
  legend: string;
  name: string;
  options: ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  stacked?: boolean;
  hint?: string;
}

/** Radios nativos: nombre accesible (legend) y navegación con flechas sin código extra. */
function ChoiceGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  stacked = false,
  hint,
}: ChoiceGroupProps<T>) {
  const hintId = hint ? `${name}-hint` : undefined;
  return (
    <fieldset aria-describedby={hintId}>
      <legend className="text-sm font-medium">{legend}</legend>
      {hint && (
        <p id={hintId} className="text-sm text-neutral-600 dark:text-neutral-300">
          {hint}
        </p>
      )}
      <div className={`mt-1 flex gap-3 ${stacked ? "flex-col" : ""}`}>
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex-1 min-h-12 flex items-center justify-center rounded-xl border-2 px-4 font-semibold cursor-pointer transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand ${
              value === option.value
                ? "border-brand bg-brand-light text-brand-dark"
                : "border-neutral-200 dark:border-neutral-700"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function toFractureAnswer(hasFractureHistory: boolean | null): FractureAnswer | null {
  if (hasFractureHistory === null) return null;
  return hasFractureHistory ? "si" : "no";
}

interface PatientProfileModalProps {
  onClose: () => void;
}

/** Se monta solo al abrirse: el formulario siempre parte del perfil guardado actual. */
export function PatientProfileModal({ onClose }: PatientProfileModalProps) {
  const profile = useSyncExternalStore(
    patientProfileStore.subscribe,
    patientProfileStore.getSnapshot,
    patientProfileStore.getServerSnapshot
  );

  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age?.toString() ?? "");
  const [sex, setSex] = useState<Sex | null>(profile.sex);
  const [weightKg, setWeightKg] = useState(profile.weightKg?.toString() ?? "");
  const [fractureAnswer, setFractureAnswer] = useState(toFractureAnswer(profile.hasFractureHistory));
  const [menopausalStatus, setMenopausalStatus] = useState(profile.menopausalStatus);
  const [allergies, setAllergies] = useState(profile.allergies);
  const [phone, setPhone] = useState(profile.phone);
  const [hasConsented, setHasConsented] = useState(false);
  const [isAgeTouched, setIsAgeTouched] = useState(false);
  const needsConsent = !isConsentCurrent(profile.consent);
  const ageResult = parseProfileAgeInput(age);
  const ageError = isAgeTouched && !ageResult.ok ? ageResult.error : null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (needsConsent && !hasConsented) return;
    if (!ageResult.ok) {
      setIsAgeTouched(true);
      return;
    }
    const parsedWeight = Number(weightKg);

    patientProfileStore.write({
      name: name.trim(),
      age: ageResult.value,
      sex,
      weightKg: weightKg.trim() !== "" && !Number.isNaN(parsedWeight) ? parsedWeight : null,
      hasFractureHistory: fractureAnswer === null ? null : fractureAnswer === "si",
      // El estado menopáusico solo aplica a mujeres.
      menopausalStatus: sex === "femenino" ? menopausalStatus : null,
      allergies: allergies.trim(),
      phone: phone.trim(),
      consent: needsConsent ? createConsentRecord() : profile.consent,
    });
    onClose();
  }

  return (
    <ModalDialog labelledBy="patient-profile-heading" onClose={onClose}>
        <div className="flex items-center justify-between">
          <h2 id="patient-profile-heading" className="text-xl font-bold">
            Mi Perfil Médico
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="min-h-12 min-w-12 rounded-xl text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Nombre completo</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-12 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 px-3 bg-transparent"
              placeholder="Ej. Rosa Fernández"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Edad</span>
              <input
                value={age}
                onChange={(e) => setAge(e.target.value)}
                onBlur={() => setIsAgeTouched(true)}
                inputMode="numeric"
                aria-invalid={ageError !== null}
                aria-describedby={ageError ? "profile-age-error" : undefined}
                className="min-h-12 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 px-3 bg-transparent"
                placeholder="Ej. 58"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Peso aproximado (kg)</span>
              <input
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                inputMode="decimal"
                className="min-h-12 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 px-3 bg-transparent"
                placeholder="Ej. 68"
              />
            </label>
          </div>
          <p
            id="profile-age-error"
            aria-live="polite"
            className="text-risk-high dark:text-red-300 empty:hidden"
          >
            {ageError}
          </p>

          <ChoiceGroup
            legend="Sexo biológico"
            name="profile-sex"
            options={SEX_OPTIONS}
            value={sex}
            onChange={setSex}
            hint="Si eliges Femenino, te preguntaremos tu estado menopáusico."
          />

          {sex === "femenino" && (
            <ChoiceGroup
              legend="Estado menopáusico (define cómo se interpreta tu densitometría)"
              name="profile-menopausal-status"
              options={MENOPAUSAL_OPTIONS}
              value={menopausalStatus}
              onChange={setMenopausalStatus}
              stacked
            />
          )}

          <ChoiceGroup
            legend="¿Antecedente de fractura?"
            name="profile-fracture-history"
            options={FRACTURE_OPTIONS}
            value={fractureAnswer}
            onChange={setFractureAnswer}
          />

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Alergias conocidas</span>
            <input
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              className="min-h-12 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 px-3 bg-transparent"
              placeholder="Ej. Ninguna"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Teléfono de contacto</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              className="min-h-12 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 px-3 bg-transparent"
              placeholder="Ej. 987654321"
            />
          </label>

          {needsConsent && (
            <ConsentCheckbox checked={hasConsented} onChange={setHasConsented} />
          )}

          <button
            type="submit"
            disabled={needsConsent && !hasConsented}
            className="min-h-12 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-lg transition-colors"
          >
            Guardar Perfil
          </button>
        </form>
    </ModalDialog>
  );
}
