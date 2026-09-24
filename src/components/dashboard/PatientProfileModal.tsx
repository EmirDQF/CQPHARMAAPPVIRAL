"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { ConsentCheckbox } from "@/components/privacy/ConsentCheckbox";
import { patientProfileStore } from "@/lib/dashboard/patientProfile";
import { createConsentRecord, isConsentCurrent } from "@/lib/privacy/consent";
import type { Sex } from "@/lib/types";

interface PatientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PatientProfileModal({ isOpen, onClose }: PatientProfileModalProps) {
  const profile = useSyncExternalStore(
    patientProfileStore.subscribe,
    patientProfileStore.getSnapshot,
    patientProfileStore.getServerSnapshot
  );

  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age?.toString() ?? "");
  const [sex, setSex] = useState<Sex | null>(profile.sex);
  const [weightKg, setWeightKg] = useState(profile.weightKg?.toString() ?? "");
  const [hasFractureHistory, setHasFractureHistory] = useState(profile.hasFractureHistory);
  const [allergies, setAllergies] = useState(profile.allergies);
  const [phone, setPhone] = useState(profile.phone);
  const [hasConsented, setHasConsented] = useState(false);
  const needsConsent = !isConsentCurrent(profile.consent);

  if (!isOpen) return null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (needsConsent && !hasConsented) return;
    const parsedAge = Number(age);
    const parsedWeight = Number(weightKg);

    patientProfileStore.write({
      name: name.trim(),
      age: age.trim() !== "" && !Number.isNaN(parsedAge) ? parsedAge : null,
      sex,
      weightKg: weightKg.trim() !== "" && !Number.isNaN(parsedWeight) ? parsedWeight : null,
      hasFractureHistory,
      allergies: allergies.trim(),
      phone: phone.trim(),
      consent: needsConsent ? createConsentRecord() : profile.consent,
    });
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-profile-heading"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 py-6"
    >
      <div className="w-full max-w-lg max-h-full overflow-y-auto rounded-2xl bg-background border-2 border-neutral-200 dark:border-neutral-800 px-6 py-6 flex flex-col gap-5">
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
                inputMode="numeric"
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

          <div>
            <span className="text-sm font-medium">Sexo biológico</span>
            <div className="flex gap-3 mt-1" role="radiogroup">
              {(["femenino", "masculino"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={sex === option}
                  onClick={() => setSex(option)}
                  className={`flex-1 min-h-12 rounded-xl border-2 px-4 capitalize font-semibold transition-colors ${
                    sex === option
                      ? "border-brand bg-brand-light text-brand-dark"
                      : "border-neutral-200 dark:border-neutral-700"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-sm font-medium">¿Antecedente de fractura?</span>
            <div className="flex gap-3 mt-1">
              <button
                type="button"
                aria-pressed={hasFractureHistory}
                onClick={() => setHasFractureHistory(true)}
                className={`flex-1 min-h-12 rounded-xl border-2 font-semibold transition-colors ${
                  hasFractureHistory
                    ? "border-brand bg-brand-light text-brand-dark"
                    : "border-neutral-200 dark:border-neutral-700"
                }`}
              >
                Sí
              </button>
              <button
                type="button"
                aria-pressed={!hasFractureHistory}
                onClick={() => setHasFractureHistory(false)}
                className={`flex-1 min-h-12 rounded-xl border-2 font-semibold transition-colors ${
                  !hasFractureHistory
                    ? "border-brand bg-brand-light text-brand-dark"
                    : "border-neutral-200 dark:border-neutral-700"
                }`}
              >
                No
              </button>
            </div>
          </div>

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
      </div>
    </div>
  );
}
