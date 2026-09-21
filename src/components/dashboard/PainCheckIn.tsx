"use client";

import { useState, useSyncExternalStore } from "react";
import { painLogStore, saveTodayPainLogEntry, todayIsoDate } from "@/lib/dashboard/painLog";
import type { StiffnessBucket } from "@/lib/dashboard/types";

const PAIN_LEVELS = Array.from({ length: 10 }, (_, i) => i + 1);

const STIFFNESS_OPTIONS: { value: StiffnessBucket; label: string }[] = [
  { value: "0-15", label: "0–15 min" },
  { value: "15-30", label: "15–30 min" },
  { value: "30+", label: "+30 min" },
];

export function PainCheckIn() {
  const entries = useSyncExternalStore(
    painLogStore.subscribe,
    painLogStore.getSnapshot,
    painLogStore.getServerSnapshot
  );
  const todayEntry = entries.find((entry) => entry.date === todayIsoDate()) ?? null;

  const [selectedPainLevel, setSelectedPainLevel] = useState<number | null>(null);
  const [selectedStiffness, setSelectedStiffness] = useState<StiffnessBucket | null>(null);

  const painLevel = selectedPainLevel ?? todayEntry?.painLevel ?? null;
  const stiffness = selectedStiffness ?? todayEntry?.stiffness ?? null;

  function handleSave() {
    if (painLevel === null || stiffness === null) return;
    saveTodayPainLogEntry({ painLevel, stiffness });
    setSelectedPainLevel(null);
    setSelectedStiffness(null);
  }

  return (
    <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 px-6 py-6 flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">¿Cómo amanecieron tus articulaciones hoy?</h2>
        <p className="text-sm text-neutral-500">Check-in diario · 10 segundos</p>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Nivel de dolor (1 = nada, 10 = severo)</p>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {PAIN_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setSelectedPainLevel(level)}
              aria-pressed={painLevel === level}
              className={`min-h-12 min-w-12 rounded-xl border-2 font-bold text-lg transition-colors ${
                painLevel === level
                  ? "border-brand bg-brand-light text-brand-dark"
                  : "border-neutral-200 dark:border-neutral-700 hover:border-brand/50"
              }`}
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
              onClick={() => setSelectedStiffness(option.value)}
              aria-pressed={stiffness === option.value}
              className={`flex-1 min-h-12 rounded-xl border-2 font-semibold text-base transition-colors ${
                stiffness === option.value
                  ? "border-brand bg-brand-light text-brand-dark"
                  : "border-neutral-200 dark:border-neutral-700 hover:border-brand/50"
              }`}
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
    </section>
  );
}
