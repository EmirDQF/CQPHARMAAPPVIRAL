"use client";

import Link from "next/link";
import { CalendarClock, CalendarPlus, ChartLine, ScanLine, Stethoscope, TriangleAlert, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BoneScanSummary } from "@/lib/dashboard/types";
import type { RiskLevel } from "@/lib/types";
import { NO_T_SCORE_ICON, RISK_ICON } from "./riskIcons";

interface BoneSemaphoreWidgetProps {
  scan: BoneScanSummary | null;
  onUploadClick: () => void;
}

// Colores del semáforo OMS: inalterables (verde T ≥ -1.0, ámbar -2.5 < T < -1.0, rojo T ≤ -2.5).
const semaphoreStyles: Record<RiskLevel, string> = {
  bajo: "bg-risk-low-bg text-risk-low border-risk-low",
  moderado: "bg-risk-moderate-bg text-risk-moderate border-risk-moderate",
  alto: "bg-risk-high-bg text-risk-high border-risk-high",
};

// Sin T-score aplicable no hay color OMS: tarjeta neutra con derivación médica.
const Z_SCORE_STYLE = "bg-surface text-ink border-line";

const SECONDARY_LINK =
  "min-h-12 flex items-center justify-center gap-2 rounded-control font-semibold px-4 transition-all active:scale-[0.98]";

function formatScanDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface DexaEmptyStateProps {
  onUploadClick: () => void;
}

/** Estado vacío: nunca se muestra un T-score que el paciente no haya registrado. */
function DexaEmptyState({ onUploadClick }: DexaEmptyStateProps) {
  return (
    <section
      aria-labelledby="semaforo-vacio-heading"
      className="rounded-card border-2 border-dashed border-line bg-surface px-5 py-6 flex flex-col gap-4"
    >
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-control bg-pastel-sky text-pastel-sky-ink">
          <ScanLine className="size-6" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 id="semaforo-vacio-heading" className="text-xl font-bold text-clinic">
            Sin densitometría registrada
          </h2>
          <p className="text-sm text-muted">
            Tu Semáforo Óseo se activa cuando registras los T-score de tu densitometría
            (columna lumbar y cuello femoral).
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button type="button" size="touch" onClick={onUploadClick} className="flex-1">
          <Upload aria-hidden="true" />
          Sube tu densitometría
        </Button>
        <Link href="/citas" className={`${SECONDARY_LINK} flex-1 border-2 border-brand text-clinic hover:bg-pastel-mint`}>
          <CalendarPlus aria-hidden="true" className="size-5" />
          Agendar densitometría
        </Link>
      </div>
    </section>
  );
}

/**
 * Con semáforo OMS, el peor T-score es el dato principal. Sin él (perfil que se lee con
 * Z-score), el número pasa a segundo plano: en grande se leería como osteoporosis.
 */
function ScoreBlock({ scan }: { scan: BoneScanSummary }) {
  if (!scan.riskLevel) {
    return (
      <div className="flex flex-col gap-1">
        <p id="semaforo-oseo-heading" className="text-2xl font-bold">
          {scan.diagnosisLabel}
        </p>
        <p className="text-sm text-muted">
          T-score registrado: <span className="tabular-nums">{scan.worstTScore.toFixed(1)}</span> (en tu perfil no
          se interpreta con el semáforo OMS)
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide">Peor T-Score (lumbar / cuello femoral)</p>
        <p id="semaforo-oseo-heading" className="text-6xl font-extrabold leading-none tabular-nums">
          {scan.worstTScore.toFixed(1)}
        </p>
      </div>
      <span className="mb-1 rounded-full border-2 border-current bg-surface/70 px-3 py-1 text-base font-bold uppercase">
        {scan.diagnosisLabel}
      </span>
    </div>
  );
}

export function BoneSemaphoreWidget({ scan, onUploadClick }: BoneSemaphoreWidgetProps) {
  if (!scan) return <DexaEmptyState onUploadClick={onUploadClick} />;

  const StatusIcon = scan.riskLevel ? RISK_ICON[scan.riskLevel] : NO_T_SCORE_ICON;

  return (
    <section
      aria-labelledby="semaforo-oseo-heading"
      className={`rounded-card border-2 shadow-soft px-5 py-6 flex flex-col gap-4 ${scan.riskLevel ? semaphoreStyles[scan.riskLevel] : Z_SCORE_STYLE}`}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold">
          Tu última densitometría: {formatScanDate(scan.scanDate)}
        </p>
        <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-surface/80">
          <StatusIcon className="size-6" />
        </span>
      </div>

      <ScoreBlock scan={scan} />

      <p className="text-base font-medium">{scan.diagnosisMessage}</p>

      {scan.riskLevel === "alto" && (
        <Link
          href="/citas"
          className={`${SECONDARY_LINK} bg-risk-high text-white text-center shadow-sm hover:bg-risk-high/90 py-2`}
        >
          <Stethoscope aria-hidden="true" className="size-5 shrink-0" />
          Agendar evaluación reumatológica
        </Link>
      )}

      {scan.profileNote && (
        <p
          role="note"
          className="flex items-start gap-2 rounded-control border-2 border-current bg-surface/80 px-4 py-3 font-semibold"
        >
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <span>
            <span className="sr-only">Aviso: </span>
            {scan.profileNote}
          </span>
        </p>
      )}

      <div className="flex flex-wrap gap-3 pt-1">
        <a href="#tendencia" className={`${SECONDARY_LINK} border border-current bg-surface/70 text-sm hover:bg-surface`}>
          <ChartLine aria-hidden="true" className="size-4" />
          Ver Gráfico Comparativo
        </a>
        <span className="min-h-12 flex items-center justify-center gap-2 px-2 text-sm font-semibold">
          <CalendarClock aria-hidden="true" className="size-4" />
          Próximo control: {scan.nextControlMonths} meses
        </span>
      </div>

      <p className="text-sm">
        Resultado informativo. La interpretación y el tratamiento los define tu médico.
      </p>
    </section>
  );
}
