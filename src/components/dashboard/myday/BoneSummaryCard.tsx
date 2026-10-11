import Link from "next/link";
import type { BoneScanSummary } from "@/lib/dashboard/types";
import type { RiskLevel } from "@/lib/types";
import { NO_T_SCORE_ICON, RISK_ICON } from "../riskIcons";

/** Colores OMS del semáforo: no se pastelizan (mantienen urgencia y contraste AA). */
const RISK_STYLE: Record<RiskLevel, string> = {
  bajo: "bg-risk-low-bg text-risk-low border-risk-low",
  moderado: "bg-risk-moderate-bg text-risk-moderate border-risk-moderate",
  alto: "bg-risk-high-bg text-risk-high border-risk-high",
};

interface BoneSummaryCardProps {
  scan: BoneScanSummary | null;
  onOpenBoneTab: () => void;
}

const SECONDARY_BUTTON =
  "min-h-12 flex-1 inline-flex items-center justify-center rounded-control border-2 border-current px-4 font-semibold";

export function BoneSummaryCard({ scan, onOpenBoneTab }: BoneSummaryCardProps) {
  if (!scan) {
    return (
      <section aria-labelledby="hueso-resumen" className="rounded-card border-2 border-dashed border-line bg-surface px-5 py-5 flex flex-col gap-3">
        <h2 id="hueso-resumen" className="text-lg font-bold">Sin densitometría registrada</h2>
        <p className="text-muted">Tu Semáforo Óseo se activa cuando registras los T-score de tu densitometría.</p>
        <div className="flex flex-col sm:flex-row gap-3 text-clinic">
          <button type="button" onClick={onOpenBoneTab} className={SECONDARY_BUTTON}>Registrar mi densitometría</button>
          <Link href="/citas" className={SECONDARY_BUTTON}>Agendar densitometría</Link>
        </div>
      </section>
    );
  }
  const style = scan.riskLevel ? RISK_STYLE[scan.riskLevel] : "bg-surface text-foreground border-line";
  const StatusIcon = scan.riskLevel ? RISK_ICON[scan.riskLevel] : NO_T_SCORE_ICON;
  return (
    <section aria-labelledby="hueso-resumen" className={`rounded-card border-2 px-5 py-5 flex flex-col gap-3 ${style}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id="hueso-resumen" className="text-lg font-bold">Tu Semáforo Óseo</h2>
        <StatusIcon aria-hidden="true" className="size-6 shrink-0" />
      </div>
      {scan.riskLevel ? (
        <p className="text-lg">
          Peor T-score <strong className="text-2xl tabular-nums">{scan.worstTScore.toFixed(1)}</strong> ·{" "}
          <strong>{scan.diagnosisLabel}</strong>
        </p>
      ) : (
        <p className="text-lg font-bold">{scan.diagnosisLabel}</p>
      )}
      <button type="button" onClick={onOpenBoneTab} className={SECONDARY_BUTTON}>Ver mi detalle</button>
    </section>
  );
}
