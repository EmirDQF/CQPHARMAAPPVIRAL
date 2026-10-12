"use client";

import { Lightbulb } from "lucide-react";
import { useSyncExternalStore } from "react";
import { buildBottleStatuses } from "@/lib/dashboard/bottleTracking";
import { bottlesStore } from "@/lib/dashboard/bottles";
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
  const bottlesState = useSyncExternalStore(
    bottlesStore.subscribe,
    bottlesStore.getSnapshot,
    bottlesStore.getServerSnapshot
  );
  const bottles = buildBottleStatuses(state, bottlesState);

  return (
    <section className="rounded-card border border-line bg-surface shadow-soft px-6 py-6 flex flex-col gap-5">
      <h2 className="text-xl font-bold">Tus Frascos CQ Pharma</h2>

      <div className="flex flex-col gap-4">
        {bottles.map((bottle) => (
          <div key={bottle.period} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{bottle.label}</p>
              <span
                className={`text-sm font-semibold whitespace-nowrap ${
                  bottle.needsRestock ? "text-risk-moderate" : "text-muted"
                }`}
              >
                {bottle.servingsRemaining} tomas restantes
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-line overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  bottle.needsRestock ? "bg-risk-moderate" : "bg-progress"
                }`}
                style={{ width: `${bottle.percentRemaining}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-line">
        <p className="text-lg font-semibold">Consejos clínicos de absorción</p>
        {ABSORPTION_TIPS.map((tip) => (
          <p key={tip} className="flex items-start gap-2 text-lg text-muted">
            <Lightbulb aria-hidden="true" className="mt-0.5 size-4 text-clinic shrink-0" />
            <span>{tip}</span>
          </p>
        ))}
      </div>
    </section>
  );
}
