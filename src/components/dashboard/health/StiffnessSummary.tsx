"use client";

import { useSyncExternalStore } from "react";
import { stiffnessCounts } from "@/lib/dashboard/healthSummary";
import { painLogStore } from "@/lib/dashboard/painLog";
import type { StiffnessBucket } from "@/lib/dashboard/types";

const WINDOW_DAYS = 30;
const LABELS: Record<StiffnessBucket, string> = { "0-15": "0–15 min", "15-30": "15–30 min", "30+": "+30 min" };
const BAR_CLASS: Record<StiffnessBucket, string> = { "0-15": "bg-vital-deep", "15-30": "bg-gold-deep", "30+": "bg-streak-deep" };

/** Rigidez al despertar REGISTRADA en 30 días (descriptivo, sin interpretar ni atribuir). */
export function StiffnessSummary({ now }: { now: Date }) {
  const entries = useSyncExternalStore(painLogStore.subscribe, painLogStore.getSnapshot, painLogStore.getServerSnapshot);
  const counts = stiffnessCounts(entries, WINDOW_DAYS, now);
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <section aria-labelledby="rigidez-registrada" className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5 shadow-soft">
      <h2 id="rigidez-registrada" className="text-xl font-bold text-clinic">
        Rigidez al despertar (30 días)
      </h2>
      {total === 0 ? (
        <p className="text-lg text-muted">Aún no hay chequeos registrados. Cuando hagas el primero, aparecerá aquí. 🌱</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {(Object.keys(LABELS) as StiffnessBucket[]).map((bucket) => (
            <li key={bucket} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-lg">{LABELS[bucket]}</span>
              <span className="h-4 flex-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
                <span className={`block h-full rounded-full ${BAR_CLASS[bucket]} transition-[width] duration-700`} style={{ width: `${(counts[bucket] / total) * 100}%` }} />
              </span>
              <span className="w-16 text-right text-lg font-bold">
                {counts[bucket]} {counts[bucket] === 1 ? "día" : "días"}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-base text-muted">Muestra solo lo que registraste. Tu médico lo interpreta contigo.</p>
    </section>
  );
}
