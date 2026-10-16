"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { ConsentCheckbox } from "@/components/privacy/ConsentCheckbox";
import { ChoiceGroup, type ChoiceOption } from "@/components/ui/ChoiceGroup";
import { GameButton } from "@/components/ui/GameButton";
import { ModalDialog } from "@/components/ui/ModalDialog";
import {
  parseProfileAgeInput,
  patientProfileStore,
  savePatientProfile,
} from "@/lib/dashboard/patientProfile";
import { createConsentRecord, isConsentCurrent } from "@/lib/privacy/consent";
import { MENOPAUSE_UNCERTAIN_NOTE, type MenopausalStatus } from "@/lib/clinical/tScoreEligibility";
import type { Sex } from "@/lib/types";

type FractureAnswer = "si" | "no";

const SEX_OPTIONS: ChoiceOption<Sex>[] = [
  { value: "femenino", label: "Femenino" },
  { value: "masculino", label: "Masculino" },
];

const FRACTURE_OPTIONS: ChoiceOption<FractureAnswer>[] = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
];

const MENOPAUSAL_OPTIONS: ChoiceOption<MenopausalStatus>[] = [
  { value: "posmenopausica", label: "Sí, ya la pasé" },
  { value: "premenopausica", label: "Aún no" },
  { value: "no-segura", label: "No estoy segura" },
  { value: "no-decir", label: "Prefiero no decirlo" },
];

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

    savePatientProfile({
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
          <h2 id="patient-profile-heading" className="text-3xl font-black text-clinic">
            Mi perfil
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
            <span className="text-lg font-bold">Nombre o apodo</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-12 rounded-2xl border-2 border-line px-4 text-lg bg-surface"
              placeholder="Ej. Rosa Fernández"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-lg font-bold">Edad</span>
              <input
                value={age}
                onChange={(e) => setAge(e.target.value)}
                onBlur={() => setIsAgeTouched(true)}
                inputMode="numeric"
                aria-invalid={ageError !== null}
                aria-describedby={ageError ? "profile-age-error" : undefined}
                className="min-h-12 rounded-2xl border-2 border-line px-4 text-lg bg-surface"
                placeholder="Ej. 58"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-lg font-bold">Peso aproximado (kg)</span>
              <input
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                inputMode="decimal"
                className="min-h-12 rounded-2xl border-2 border-line px-4 text-lg bg-surface"
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
              legend="¿Ya pasaste la menopausia? (define cómo se interpreta tu densitometría)"
              name="profile-menopausal-status"
              options={MENOPAUSAL_OPTIONS}
              value={menopausalStatus}
              onChange={setMenopausalStatus}
              stacked
              hint={
                menopausalStatus === "no-segura" || menopausalStatus === "no-decir"
                  ? MENOPAUSE_UNCERTAIN_NOTE
                  : undefined
              }
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
            <span className="text-lg font-bold">Alergias conocidas</span>
            <input
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              className="min-h-12 rounded-2xl border-2 border-line px-4 text-lg bg-surface"
              placeholder="Ej. Ninguna"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-lg font-bold">Teléfono de contacto</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              className="min-h-12 rounded-2xl border-2 border-line px-4 text-lg bg-surface"
              placeholder="Ej. 987654321"
            />
          </label>

          {needsConsent && (
            <ConsentCheckbox checked={hasConsented} onChange={setHasConsented} />
          )}

          <GameButton type="submit" tone="vital" block disabled={needsConsent && !hasConsented}>
            Guardar perfil
          </GameButton>
          {needsConsent && !hasConsented && (
            <p className="text-lg text-muted">Para guardar, marca primero la autorización.</p>
          )}
        </form>
    </ModalDialog>
  );
}
