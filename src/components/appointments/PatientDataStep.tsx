"use client";

import { useState, type FormEvent } from "react";
import { ConsentCheckbox } from "@/components/privacy/ConsentCheckbox";
import type { AppointmentBookedBy, AppointmentPatient } from "@/lib/appointments/types";
import { createConsentRecord, type ConsentRecord } from "@/lib/privacy/consent";

interface PatientDataStepProps {
  onBack: () => void;
  onSubmit: (patient: AppointmentPatient, consent: ConsentRecord) => void;
}

export function PatientDataStep({ onBack, onSubmit }: PatientDataStepProps) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [bookedBy, setBookedBy] = useState<AppointmentBookedBy>("propia");
  const [hasConsented, setHasConsented] = useState(false);

  const parsedAge = Number(age);
  const isValid =
    name.trim().length > 1 &&
    phone.trim().length >= 6 &&
    parsedAge > 0 &&
    parsedAge < 120 &&
    hasConsented;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid) return;
    onSubmit(
      { name: name.trim(), age: parsedAge, phone: phone.trim(), bookedBy },
      createConsentRecord()
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold text-brand">Paso 3 de 3</p>
        <h2 className="text-xl font-bold">Datos del paciente</h2>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Nombre completo</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-h-12 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 px-4 text-base bg-transparent"
          placeholder="Ej. María Torres"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Edad</span>
        <input
          value={age}
          onChange={(e) => setAge(e.target.value)}
          inputMode="numeric"
          className="min-h-12 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 px-4 text-base bg-transparent"
          placeholder="Ej. 58"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Teléfono</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          className="min-h-12 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 px-4 text-base bg-transparent"
          placeholder="Ej. 987654321"
        />
      </label>

      <div>
        <p className="text-sm font-medium mb-2">¿Quién agenda esta cita?</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setBookedBy("propia")}
            aria-pressed={bookedBy === "propia"}
            className={`flex-1 min-h-12 rounded-xl border-2 font-semibold transition-colors ${
              bookedBy === "propia"
                ? "border-brand bg-brand-light text-brand-dark"
                : "border-neutral-200 dark:border-neutral-700"
            }`}
          >
            Por mi cuenta
          </button>
          <button
            type="button"
            onClick={() => setBookedBy("hijo")}
            aria-pressed={bookedBy === "hijo"}
            className={`flex-1 min-h-12 rounded-xl border-2 font-semibold transition-colors ${
              bookedBy === "hijo"
                ? "border-brand bg-brand-light text-brand-dark"
                : "border-neutral-200 dark:border-neutral-700"
            }`}
          >
            La agenda un hijo/a
          </button>
        </div>
      </div>

      <ConsentCheckbox checked={hasConsented} onChange={setHasConsented} />

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="min-h-12 flex-1 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 font-semibold"
        >
          ← Atrás
        </button>
        <button
          type="submit"
          disabled={!isValid}
          className="min-h-12 flex-[2] rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-lg transition-colors"
        >
          Confirmar Cita
        </button>
      </div>
    </form>
  );
}
