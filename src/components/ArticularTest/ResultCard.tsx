import Link from "next/link";
import type { RiskResult } from "@/lib/types";
import {
  buildDensitometriaWhatsAppLink,
  buildSupplementWhatsAppLink,
} from "@/lib/whatsapp";
import { ArtikoFigure } from "@/components/mascot/ArtikoFigure";
import { gameButtonClasses } from "@/components/ui/gameButtonClasses";
import { WhatsAppCta } from "@/components/ui/WhatsAppCta";
import type { ArtikoEmotion } from "@/lib/mascot/mascot";
import { ShareInviteActions } from "./ShareInviteActions";

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

interface ResultCardProps {
  result: RiskResult;
  onRestart: () => void;
}

const riskStyles: Record<RiskResult["riskLevel"], string> = {
  bajo: "bg-risk-low-bg text-risk-low border-risk-low",
  moderado: "bg-risk-moderate-bg text-risk-moderate border-risk-moderate",
  alto: "bg-risk-high-bg text-risk-high border-risk-high",
};

/** Artiko acompaña el resultado con calma: nunca dramatiza un riesgo alto. */
const ARTIKO_BY_RISK: Record<RiskResult["riskLevel"], ArtikoEmotion> = {
  bajo: "happy",
  moderado: "thinking",
  alto: "waiting",
};

export function ResultCard({ result, onRestart }: ResultCardProps) {
  const densitometriaLink = buildDensitometriaWhatsAppLink();
  const supplementLink = buildSupplementWhatsAppLink();
  const needsRheumatologyReview = result.riskLevel === "alto";

  return (
    <div className="w-full max-w-md mx-auto rounded-card border border-line bg-surface shadow-soft overflow-hidden">
      <div className="flex items-center gap-3 bg-vital px-6 py-4 text-vital-ink">
        <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-white">
          <ArtikoFigure emotion={ARTIKO_BY_RISK[result.riskLevel]} size={64} decorative />
        </span>
        <div>
          <p className="text-base font-bold">
            <span aria-hidden="true">🦴 </span>Reporte de Salud Ósea &amp; Articular
          </p>
          <p className="text-2xl font-black">Artikare</p>
        </div>
      </div>

      <div className="px-6 py-5 flex flex-col gap-5">
        <div className="flex justify-between gap-4">
          <div>
            <p className="text-xs text-muted uppercase tracking-wide">
              Edad real
            </p>
            <p className="text-3xl font-black">{result.chronologicalAge} años</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted uppercase tracking-wide">
              Edad articular estimada
            </p>
            <p className="text-3xl font-black">{result.articularAge} años</p>
          </div>
        </div>

        <div
          className={`rounded-xl border px-4 py-3 flex items-center gap-2 font-semibold ${riskStyles[result.riskLevel]}`}
        >
          <span className="text-lg" aria-hidden="true">{result.emoji}</span>
          <span>{result.label}</span>
        </div>

        <p className="text-base text-ink">
          {result.message}
        </p>

        {/* Bandera roja: el reumatólogo va antes que cualquier estudio o suplemento. */}
        {needsRheumatologyReview && (
          <Link
            href="/citas"
            className={`w-full min-h-12 flex items-center justify-center text-center rounded-2xl bg-risk-high text-white text-lg font-black px-4 py-3 ${FOCUS_RING}`}
          >
            Agendar evaluación reumatológica
          </Link>
        )}

        <div className="flex flex-col gap-2 text-sm">
          <div className="rounded-control bg-pastel-sky text-pastel-sky-ink px-4 py-3">
            <p className="font-bold">Estudio recomendado</p>
            <p>
              {result.diagnosticSuggestion}
            </p>
          </div>
          <div className="rounded-control bg-pastel-lemon text-pastel-lemon-ink px-4 py-3">
            <p className="font-bold">Suplementación que puede acompañar tu cuidado</p>
            <p>
              {result.supplementProtocol}
            </p>
            <p>Consulta con tu médico antes de empezar.</p>
          </div>
        </div>

        <p className="text-sm text-muted">
          Este test es orientativo y no reemplaza un diagnóstico médico
          profesional. Consulta a tu especialista en reumatología.
        </p>

        <div className="flex flex-col gap-3 pt-2">
          <WhatsAppCta
            href={densitometriaLink}
            className={gameButtonClasses({ tone: "vital", size: "lg", block: true })}
          >
            Agendar Densitometría por WhatsApp
          </WhatsAppCta>
          <WhatsAppCta
            href={supplementLink}
            className={gameButtonClasses({ tone: "surface", size: "lg", block: true })}
          >
            Pedir mi Pack CQ Pharma por WhatsApp
          </WhatsAppCta>
          <ShareInviteActions />
          <button
            type="button"
            onClick={onRestart}
            className={`w-full min-h-12 text-center text-base font-bold text-clinic px-4 py-2 ${FOCUS_RING}`}
          >
            Volver a hacer el test
          </button>
        </div>
      </div>
    </div>
  );
}
