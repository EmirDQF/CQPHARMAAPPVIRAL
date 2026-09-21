"use client";

import { useMemo, useSyncExternalStore } from "react";
import { mergePainLogWithSeed } from "@/lib/dashboard/mockData";
import { painLogStore, stiffnessToMinutes } from "@/lib/dashboard/painLog";
import type { PainLogEntry } from "@/lib/dashboard/types";

const CHART_WIDTH = 300;
const CHART_HEIGHT = 96;
const MAX_PAIN_LEVEL = 10;

function buildBarPoints(entries: PainLogEntry[]) {
  if (entries.length === 0) return [];
  const barWidth = CHART_WIDTH / entries.length;

  return entries.map((entry, index) => {
    const barHeight = (entry.painLevel / MAX_PAIN_LEVEL) * CHART_HEIGHT;
    return {
      x: index * barWidth,
      y: CHART_HEIGHT - barHeight,
      width: Math.max(barWidth - 2, 1),
      height: barHeight,
      date: entry.date,
    };
  });
}

function averageStiffnessMinutes(entries: PainLogEntry[]): number {
  if (entries.length === 0) return 0;
  const total = entries.reduce((sum, entry) => sum + stiffnessToMinutes(entry.stiffness), 0);
  return total / entries.length;
}

export function PainTrendChart() {
  const realEntries = useSyncExternalStore(
    painLogStore.subscribe,
    painLogStore.getSnapshot,
    painLogStore.getServerSnapshot
  );
  const entries = useMemo(() => mergePainLogWithSeed(realEntries), [realEntries]);

  const stiffnessImprovement = useMemo(() => {
    if (entries.length < 14) return null;

    const firstWeek = entries.slice(0, 7);
    const lastWeek = entries.slice(-7);
    const before = averageStiffnessMinutes(firstWeek);
    const after = averageStiffnessMinutes(lastWeek);
    if (before <= 0) return null;

    return { percentChange: Math.round(((before - after) / before) * 100) };
  }, [entries]);

  const bars = useMemo(() => buildBarPoints(entries), [entries]);

  return (
    <section
      id="tendencia"
      className="rounded-2xl border border-neutral-200 dark:border-neutral-800 px-6 py-6 flex flex-col gap-4 scroll-mt-20"
    >
      <div>
        <h2 className="text-xl font-bold">Evolución de tus últimos 30 días</h2>
        {stiffnessImprovement && stiffnessImprovement.percentChange > 0 && (
          <p className="text-sm font-semibold text-risk-low">
            Tu rigidez matutina bajó {stiffnessImprovement.percentChange}% este mes.
          </p>
        )}
      </div>

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full h-32"
        role="img"
        aria-label="Gráfico de evolución del dolor articular en los últimos 30 días"
        preserveAspectRatio="none"
      >
        {bars.map((bar) => (
          <rect
            key={bar.date}
            x={bar.x}
            y={bar.y}
            width={bar.width}
            height={bar.height}
            rx={1.5}
            fill="var(--color-brand)"
            opacity={0.85}
          />
        ))}
      </svg>

      <p className="text-xs text-neutral-500">
        Cada barra representa el nivel de dolor reportado ese día (1–10).
      </p>
    </section>
  );
}
