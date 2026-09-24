"use client";

import { useSyncExternalStore } from "react";
import { DOSE_SCHEDULE } from "@/lib/clinical/constants";
import { calculateStreakDays, markDoseTaken, pillboxStore } from "@/lib/dashboard/pillbox";
import { formatTime24hForDisplay, toLimaIsoDate } from "@/lib/utils/date";

export function SmartPillbox() {
  const state = useSyncExternalStore(
    pillboxStore.subscribe,
    pillboxStore.getSnapshot,
    pillboxStore.getServerSnapshot
  );

  const takenToday = new Set(state.takenDoseIdsByDate[toLimaIsoDate()] ?? []);
  const streakDays = calculateStreakDays(state);

  return (
    <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 px-6 py-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Pastillero Inteligente</h2>
        <span className="text-sm font-semibold whitespace-nowrap">
          🔥 Racha: {streakDays} {streakDays === 1 ? "día" : "días"}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {DOSE_SCHEDULE.map((dose) => {
          const isTaken = takenToday.has(dose.id);
          return (
            <div
              key={dose.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-3"
            >
              <div>
                <p className="text-sm text-neutral-500">⏰ {formatTime24hForDisplay(dose.time)}</p>
                <p className="font-semibold">{dose.label}</p>
              </div>
              <button
                type="button"
                onClick={() => markDoseTaken(dose.id)}
                disabled={isTaken}
                className={`min-h-12 min-w-24 rounded-xl font-semibold px-4 transition-colors ${
                  isTaken
                    ? "bg-risk-low-bg text-risk-low cursor-default"
                    : "bg-brand hover:bg-brand-dark text-white"
                }`}
              >
                {isTaken ? "✓ Tomado" : "Tomar"}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-neutral-500">
        La constancia diaria apoya tu salud articular y ósea. Tus suplementos complementan, no reemplazan, el tratamiento indicado por tu médico.
      </p>
    </section>
  );
}
