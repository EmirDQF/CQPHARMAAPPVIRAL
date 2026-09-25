"use client";

import { useState, useSyncExternalStore } from "react";
import { PAIN_LEVEL_MAX, PAIN_LEVEL_MIN, SEVERE_PAIN_MIN_LEVEL } from "@/lib/clinical/constants";
import { isPartOfSeverePainStreak } from "@/lib/clinical/redFlags";
import { painLogStore, saveTodayPainLogEntry } from "@/lib/dashboard/painLog";
import type { StiffnessBucket } from "@/lib/dashboard/types";
import { toLimaIsoDate } from "@/lib/utils/date";

const PAIN_LEVELS_ABOVE_MIN = Array.from(
  { length: PAIN_LEVEL_MAX - PAIN_LEVEL_MIN },
  (_, index) => PAIN_LEVEL_MIN + index + 1
);

const STIFFNESS_OPTIONS: { value: StiffnessBucket; label: string }[] = [
  { value: "0-15", label: "0–15 min" },
  { value: "15-30", label: "15–30 min" },
  { value: "30+", label: "+30 min" },
];

function optionClassName(isSelected: boolean): string {
  return `min-h-12 rounded-xl border-2 font-bold text-lg transition-colors ${
    isSelected
      ? "border-brand bg-brand-light text-brand-dark"
      : "border-neutral-200 dark:border-neutral-700 hover:border-brand/50"
  }`;
}

export function PainCheckIn() {
  const entries = useSyncExternalStore(
    painLogStore.subscribe,
    painLogStore.getSnapshot,
    painLogStore.getServerSnapshot
  );
  const todayEntry = entries.find((entry) => entry.date === toLimaIsoDate()) ?? null;

  const [selectedPainLevel, setSelectedPainLevel] = useState<number | null>(null);
  const [selectedStiffness, setSelectedStiffness] = useState<StiffnessBucket | null>(null);
  const [hasJustSaved, setHasJustSaved] = useState(false);
  const [isConfirmingStreakBreak, setIsConfirmingStreakBreak] = useState(false);

  const painLevel = selectedPainLevel ?? todayEntry?.painLevel ?? null;
  const stiffness = selectedStiffness ?? todayEntry?.stiffness ?? null;

  function selectPainLevel(level: number) {
    setSelectedPainLevel(level);
    setHasJustSaved(false);
    setIsConfirmingStreakBreak(false);
  }

  function selectStiffness(value: StiffnessBucket) {
    setSelectedStiffness(value);
    setHasJustSaved(false);
  }

  // Bajar el dolor de hoy puede apagar la bandera roja de dolor severo: igual que al borrar, se confirma.
  const wouldBreakSevereStreak =
    todayEntry !== null &&
    painLevel !== null &&
    painLevel < SEVERE_PAIN_MIN_LEVEL &&
    isPartOfSeverePainStreak(todayEntry, entries);

  function saveEntry() {
    if (painLevel === null || stiffness === null) return;
    saveTodayPainLogEntry({ painLevel, stiffness });
    setSelectedPainLevel(null);
    setSelectedStiffness(null);
    setIsConfirmingStreakBreak(false);
    setHasJustSaved(true);
  }

  function handleSave() {
    if (wouldBreakSevereStreak) {
      setIsConfirmingStreakBreak(true);
      return;
    }
    saveEntry();
  }

  function keepSavedEntry() {
    setSelectedPainLevel(null);
    setSelectedStiffness(null);
    setIsConfirmingStreakBreak(false);
  }

  return (
    <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 px-6 py-6 flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">¿Cómo amanecieron tus articulaciones hoy?</h2>
        <p className="text-sm text-neutral-500">Check-in diario · 10 segundos</p>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Nivel de dolor (0 = sin dolor, 10 = el peor)</p>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          <button
            type="button"
            onClick={() => selectPainLevel(PAIN_LEVEL_MIN)}
            aria-pressed={painLevel === PAIN_LEVEL_MIN}
            className={`col-span-5 sm:col-span-10 ${optionClassName(painLevel === PAIN_LEVEL_MIN)}`}
          >
            {PAIN_LEVEL_MIN} · Sin dolor
          </button>
          {PAIN_LEVELS_ABOVE_MIN.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => selectPainLevel(level)}
              aria-pressed={painLevel === level}
              className={`min-w-12 ${optionClassName(painLevel === level)}`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Rigidez al despertar</p>
        <div className="flex gap-3">
          {STIFFNESS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => selectStiffness(option.value)}
              aria-pressed={stiffness === option.value}
              className={`flex-1 ${optionClassName(stiffness === option.value)}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={painLevel === null || stiffness === null}
        className="min-h-12 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-lg transition-colors"
      >
        {todayEntry ? "✓ Registrado hoy — actualizar" : "Guardar registro de hoy"}
      </button>

      {isConfirmingStreakBreak && todayEntry && painLevel !== null && (
        <div role="alert" className="rounded-xl border-2 border-risk-high/40 bg-risk-high-bg text-neutral-900 px-4 py-3 flex flex-col gap-3">
          <p className="font-medium">
            Tu dolor de {todayEntry.painLevel} de hoy es parte de varios días de dolor intenso,
            importante para tu reumatólogo. ¿Seguro que quieres corregirlo a {painLevel}?
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={keepSavedEntry}
              className="flex-1 min-h-12 rounded-xl border-2 border-neutral-400 bg-white font-semibold"
            >
              Mantener {todayEntry.painLevel}
            </button>
            <button
              type="button"
              onClick={saveEntry}
              className="flex-1 min-h-12 rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold"
            >
              Sí, corregir a {painLevel}
            </button>
          </div>
        </div>
      )}

      {hasJustSaved && (
        // Se celebra la constancia del registro, nunca un efecto atribuido a un producto.
        <p role="status" className="rounded-xl bg-risk-low-bg text-risk-low px-4 py-3 font-semibold">
          ✓ Registraste tu día. Tu registro constante le muestra a tu médico cómo evolucionas.
        </p>
      )}
    </section>
  );
}
