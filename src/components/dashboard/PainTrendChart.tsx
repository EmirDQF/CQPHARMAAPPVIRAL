"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { buildPainBars } from "@/lib/dashboard/painChart";
import { painLogStore } from "@/lib/dashboard/painLog";
import { selectLastDaysEntries } from "@/lib/storage/clinicalReport";

const CHART_WIDTH = 300;
const CHART_HEIGHT = 96;
const CHART_SIZE = { width: CHART_WIDTH, height: CHART_HEIGHT };
const RANGES = [7, 30] as const;
type RangeDays = (typeof RANGES)[number];
const DEFAULT_RANGE: RangeDays = 30;

/**
 * Gráfica de LO REGISTRADO por el paciente: sin datos inventados ni mejoría
 * atribuida a un producto. No resume "bajó X%": un resumen solo de mejorías,
 * junto al pastillero, se leería como efecto del suplemento.
 */
export function PainTrendChart() {
  const realEntries = useSyncExternalStore(painLogStore.subscribe, painLogStore.getSnapshot, painLogStore.getServerSnapshot);
  const [rangeDays, setRangeDays] = useState<RangeDays>(DEFAULT_RANGE);
  const entries = useMemo(() => selectLastDaysEntries(realEntries, rangeDays), [realEntries, rangeDays]);
  const bars = useMemo(() => buildPainBars(entries, CHART_SIZE), [entries]);

  return (
    <section
      id="tendencia"
      aria-labelledby="tendencia-heading"
      className="rounded-card border border-line bg-surface shadow-soft px-5 py-5 flex flex-col gap-4 scroll-mt-20"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="tendencia-heading" className="text-xl font-bold text-clinic">Lo que registraste</h2>
        <div role="group" aria-label="Periodo de la gráfica" className="flex rounded-full bg-pastel-sky p-1">
          {RANGES.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setRangeDays(days)}
              aria-pressed={rangeDays === days}
              className={`min-h-12 min-w-16 rounded-full px-3 font-semibold transition-colors duration-150 ${
                rangeDays === days ? "bg-surface text-clinic shadow-soft" : "text-pastel-sky-ink"
              }`}
            >
              {days} días
            </button>
          ))}
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-control bg-pastel-sky text-pastel-sky-ink px-4 py-4">
          Aún no hay registros en los últimos {rangeDays} días. Cuando hagas tu chequeo diario, aquí verás cómo te has sentido.
        </p>
      ) : (
        <div className="rounded-control bg-pastel-sky px-3 py-3">
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="w-full h-32"
            role="img"
            aria-label={`Dolor registrado en los últimos ${rangeDays} días: ${entries.length} registros, escala 0 a 10`}
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
                fill="var(--color-progress)"
              />
            ))}
          </svg>
        </div>
      )}

      <p className="text-lg text-muted">
        Cada barra es el nivel de dolor que anotaste ese día (0–10). Una línea baja marca un día registrado sin dolor.
      </p>
    </section>
  );
}
