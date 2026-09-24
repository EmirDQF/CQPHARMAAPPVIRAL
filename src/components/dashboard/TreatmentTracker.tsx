"use client";

import { useSyncExternalStore } from "react";
import { buildBottleStatuses } from "@/lib/dashboard/bottleTracking";
import { pillboxStore } from "@/lib/dashboard/pillbox";

const ABSORPTION_TIPS = [
  "Tomar el Citrato de Magnesio por la noche puede contribuir a la relajación muscular y apoyar tu salud ósea.",
  "Tu Colágeno Hidrolizado se complementa con Vitamina C, que contribuye a la formación normal de colágeno.",
];

export function TreatmentTracker() {
  const state = useSyncExternalStore(
    pillboxStore.subscribe,
    pillboxStore.getSnapshot,
    pillboxStore.getServerSnapshot
  );
  const bottles = buildBottleStatuses(state);

  return (
    <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 px-6 py-6 flex flex-col gap-5">
      <h2 className="text-xl font-bold">Tus Frascos CQ Pharma</h2>

      <div className="flex flex-col gap-4">
        {bottles.map((bottle) => (
          <div key={bottle.period} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{bottle.label}</p>
              <span
                className={`text-sm font-semibold whitespace-nowrap ${
                  bottle.needsRestock ? "text-risk-moderate" : "text-neutral-500"
                }`}
              >
                {bottle.servingsRemaining} tomas restantes
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  bottle.needsRestock ? "bg-risk-moderate" : "bg-brand"
                }`}
                style={{ width: `${bottle.percentRemaining}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
        <p className="text-sm font-semibold">Consejos clínicos de absorción</p>
        {ABSORPTION_TIPS.map((tip) => (
          <p key={tip} className="text-sm text-neutral-600 dark:text-neutral-300">
            💡 {tip}
          </p>
        ))}
      </div>
    </section>
  );
}
