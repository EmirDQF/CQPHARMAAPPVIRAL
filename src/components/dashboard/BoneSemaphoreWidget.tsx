import Link from "next/link";
import type { BoneScanSummary } from "@/lib/dashboard/types";
import type { RiskLevel } from "@/lib/types";

interface BoneSemaphoreWidgetProps {
  scan: BoneScanSummary | null;
  onUploadClick: () => void;
}

const semaphoreStyles: Record<RiskLevel, string> = {
  bajo: "bg-risk-low-bg text-risk-low border-risk-low",
  moderado: "bg-risk-moderate-bg text-risk-moderate border-risk-moderate",
  alto: "bg-risk-high-bg text-risk-high border-risk-high",
};

const semaphoreEmoji: Record<RiskLevel, string> = {
  bajo: "🟢",
  moderado: "🟡",
  alto: "🔴",
};

function formatScanDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
  });
}

interface DexaEmptyStateProps {
  onUploadClick: () => void;
}

/** Estado vacío: nunca se muestra un T-score que el paciente no haya registrado. */
export function DexaEmptyState({ onUploadClick }: DexaEmptyStateProps) {
  return (
    <section
      aria-labelledby="semaforo-vacio-heading"
      className="rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 px-6 py-6 flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <h2 id="semaforo-vacio-heading" className="text-xl font-bold">
          Sin densitometría registrada
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Tu Semáforo Óseo se activa cuando registras los T-score de tu densitometría
          (columna lumbar y cuello femoral).
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onUploadClick}
          className="min-h-12 flex-1 rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold px-4 transition-colors"
        >
          Sube tu densitometría
        </button>
        <Link
          href="/citas"
          className="min-h-12 flex-1 flex items-center justify-center rounded-xl border-2 border-brand text-brand font-semibold px-4 transition-colors hover:bg-brand-light dark:hover:bg-brand-dark/30"
        >
          Agendar densitometría
        </Link>
      </div>
    </section>
  );
}

export function BoneSemaphoreWidget({ scan, onUploadClick }: BoneSemaphoreWidgetProps) {
  if (!scan) return <DexaEmptyState onUploadClick={onUploadClick} />;

  return (
    <section
      aria-labelledby="semaforo-oseo-heading"
      className={`rounded-2xl border-2 px-6 py-6 flex flex-col gap-4 ${semaphoreStyles[scan.riskLevel]}`}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold opacity-80">
          Tu última densitometría: {formatScanDate(scan.scanDate)}
        </p>
        <span className="text-2xl" aria-hidden="true">
          {semaphoreEmoji[scan.riskLevel]}
        </span>
      </div>

      <div className="flex items-end gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide opacity-70">
            Peor T-Score (lumbar / cuello femoral)
          </p>
          <p id="semaforo-oseo-heading" className="text-6xl font-extrabold leading-none">
            {scan.worstTScore.toFixed(1)}
          </p>
        </div>
        <span className="text-lg font-bold uppercase pb-1">{scan.diagnosisLabel}</span>
      </div>

      <p className="text-base font-medium">{scan.diagnosisMessage}</p>

      {scan.riskLevel === "alto" && (
        <Link
          href="/citas"
          className="min-h-12 flex items-center justify-center rounded-xl bg-risk-high text-white font-semibold px-4"
        >
          Agendar evaluación reumatológica
        </Link>
      )}

      <div className="flex flex-wrap gap-3 pt-1">
        <a
          href="#tendencia"
          className="min-h-12 flex items-center justify-center rounded-xl bg-white/70 dark:bg-black/20 border border-current px-4 text-sm font-semibold"
        >
          Ver Gráfico Comparativo
        </a>
        <span className="min-h-12 flex items-center justify-center rounded-xl px-4 text-sm font-semibold opacity-80">
          Próximo control: {scan.nextControlMonths} meses
        </span>
      </div>

      <p className="text-xs opacity-70">
        Resultado informativo. La interpretación y el tratamiento los define tu médico.
      </p>
    </section>
  );
}
