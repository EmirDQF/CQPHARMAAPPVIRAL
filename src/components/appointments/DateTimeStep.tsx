"use client";

import { useState } from "react";
import type { AvailableDay } from "@/lib/appointments/availability";
import type { AppointmentSlot } from "@/lib/appointments/types";

interface DateTimeStepProps {
  availableDays: AvailableDay[];
  onBack: () => void;
  onSelect: (date: string, slot: AppointmentSlot) => void;
}

const SLOT_LABELS: Record<AppointmentSlot, string> = {
  manana: "Mañana",
  tarde: "Tarde",
};

export function DateTimeStep({ availableDays, onBack, onSelect }: DateTimeStepProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedDay = availableDays.find((day) => day.date === selectedDate) ?? null;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold text-brand">Paso 2 de 3</p>
        <h2 className="text-xl font-bold">Elige fecha y turno</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {availableDays.map((day) => (
          <button
            key={day.date}
            type="button"
            onClick={() => setSelectedDate(day.date)}
            aria-pressed={selectedDate === day.date}
            className={`min-h-12 rounded-xl border-2 font-semibold text-sm px-2 py-2 transition-colors capitalize ${
              selectedDate === day.date
                ? "border-brand bg-brand-light text-brand-dark"
                : "border-neutral-200 dark:border-neutral-700 hover:border-brand/50"
            }`}
          >
            {day.label}
          </button>
        ))}
      </div>

      {selectedDay && (
        <div>
          <p className="text-sm font-medium mb-2">Turno disponible</p>
          <div className="flex gap-3">
            {(Object.keys(SLOT_LABELS) as AppointmentSlot[]).map((slot) => {
              const isAvailable = selectedDay.slots[slot];
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => onSelect(selectedDay.date, slot)}
                  className={`flex-1 min-h-12 rounded-xl border-2 font-semibold transition-colors ${
                    isAvailable
                      ? "border-neutral-200 dark:border-neutral-700 hover:border-brand"
                      : "border-neutral-100 dark:border-neutral-800 text-neutral-400 cursor-not-allowed"
                  }`}
                >
                  {SLOT_LABELS[slot]} {isAvailable ? "" : "· Sin cupo"}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onBack}
        className="self-start text-sm font-semibold text-neutral-500 hover:text-brand"
      >
        ← Cambiar servicio
      </button>
    </section>
  );
}
