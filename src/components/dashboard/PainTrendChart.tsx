"use client";

import { useMemo, useSyncExternalStore } from "react";
import { buildPainBars } from "@/lib/dashboard/painChart";
import { painLogStore } from "@/lib/dashboard/painLog";
import {
  calculateStiffnessReductionPercent,
  selectLast30DaysEntries,
} from "@/lib/storage/clinicalReport";

const CHART_WIDTH = 300;
const CHART_HEIGHT = 96;
const CHART_SIZE = { width: CHART_WIDTH, height: CHART_HEIGHT };

export function PainTrendChart() {
  const realEntries = useSyncExternalStore(
    painLogStore.subscribe,
    painLogStore.getSnapshot,
    painLogStore.getServerSnapshot,
  );
  const entries = useMemo(
    () => selectLast30DaysEntries(realEntries),
    [realEntries],
  );

  const stiffnessReductionPercent = useMemo(
    () => calculateStiffnessReductionPercent(entries),
    [entries],
  );

  const bars = useMemo(() => buildPainBars(entries, CHART_SIZE), [entries]);

  return (
    <section
      id="tendencia"
      className="rounded-2xl border border-neutral-200 dark:border-neutral-800 px-6 py-6 flex flex-col gap-4 scroll-mt-20"
    >
      <div>
        <h2 className="text-xl font-bold">Evolución de tus últimos 30 días</h2>
        {stiffnessReductionPercent !== null &&
          stiffnessReductionPercent > 0 && (
            <p className="text-sm font-semibold text-risk-low">
              Tu rigidez matutina reportada bajó {stiffnessReductionPercent}% en
              este periodo.
            </p>
          )}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Sin registros de dolor en los últimos 30 días. Haz tu check-in diario
          para ver tu evolución.
        </p>
      ) : (
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
              opacity={bar.isPainFree ? 0.45 : 0.85}
            />
          ))}
        </svg>
      )}

      <p className="text-xs text-neutral-500">
        Cada barra representa el nivel de dolor reportado ese día (0–10). Una línea baja marca un día registrado sin dolor.
      </p>
    </section>
  );
}
