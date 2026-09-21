import type { RiskLevel } from "@/lib/types";
import type { BoneScanSummary } from "@/lib/dashboard/types";

interface BoneSemaphoreWidgetProps {
  scan: BoneScanSummary;
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

export function BoneSemaphoreWidget({ scan }: BoneSemaphoreWidgetProps) {
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
            T-Score Cadera
          </p>
          <p id="semaforo-oseo-heading" className="text-6xl font-extrabold leading-none">
            {scan.tScoreHip.toFixed(1)}
          </p>
        </div>
        <span className="text-lg font-bold uppercase pb-1">
          {scan.diagnosisLabel}
        </span>
      </div>

      <p className="text-base font-medium">{scan.diagnosisMessage}</p>

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
    </section>
  );
}
