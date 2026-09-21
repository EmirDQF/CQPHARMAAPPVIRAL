"use client";

import { useMemo } from "react";
import type { DexaScanEntry } from "@/lib/dashboard/dexaVault";

interface DexaTrendChartProps {
  entries: DexaScanEntry[];
}

const CHART_WIDTH = 280;
const CHART_HEIGHT = 100;
const MIN_T_SCORE = -4;
const MAX_T_SCORE = 1;

function scoreToY(score: number): number {
  const clamped = Math.min(MAX_T_SCORE, Math.max(MIN_T_SCORE, score));
  const ratio = (clamped - MIN_T_SCORE) / (MAX_T_SCORE - MIN_T_SCORE);
  return CHART_HEIGHT - ratio * CHART_HEIGHT;
}

function buildPolylinePoints(
  entries: DexaScanEntry[],
  selector: (entry: DexaScanEntry) => number
): string {
  if (entries.length === 0) return "";
  const stepX = entries.length > 1 ? CHART_WIDTH / (entries.length - 1) : 0;
  return entries
    .map((entry, index) => `${index * stepX},${scoreToY(selector(entry))}`)
    .join(" ");
}

export function DexaTrendChart({ entries }: DexaTrendChartProps) {
  const lumbarPoints = useMemo(
    () => buildPolylinePoints(entries, (entry) => entry.lumbarTScore),
    [entries]
  );
  const femoralPoints = useMemo(
    () => buildPolylinePoints(entries, (entry) => entry.femoralNeckTScore),
    [entries]
  );

  if (entries.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-medium mb-2">Evolución del T-Score</p>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full h-28"
        role="img"
        aria-label="Evolución del T-Score lumbar y femoral en el tiempo"
        preserveAspectRatio="none"
      >
        <polyline points={lumbarPoints} fill="none" stroke="var(--color-brand)" strokeWidth={2} />
        <polyline
          points={femoralPoints}
          fill="none"
          stroke="var(--color-risk-moderate)"
          strokeWidth={2}
        />
      </svg>
      <div className="flex gap-4 text-xs text-neutral-500 mt-1">
        <span>— Columna Lumbar</span>
        <span className="text-risk-moderate">— Cuello Femoral</span>
      </div>
    </div>
  );
}
