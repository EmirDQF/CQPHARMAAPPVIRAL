import Link from "next/link";
import type { RiskResult } from "@/lib/types";
import {
  buildDensitometriaWhatsAppLink,
  buildSupplementWhatsAppLink,
} from "@/lib/whatsapp";
import { WhatsAppCta } from "@/components/ui/WhatsAppCta";
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

export function ResultCard({ result, onRestart }: ResultCardProps) {
  const densitometriaLink = buildDensitometriaWhatsAppLink();
  const supplementLink = buildSupplementWhatsAppLink();
  const needsRheumatologyReview = result.riskLevel === "alto";

  return (
    <div className="w-full max-w-md mx-auto rounded-card border border-line bg-surface shadow-soft overflow-hidden">
      <div className="bg-action-strong text-on-action-strong px-6 py-4">
        <p className="text-sm font-medium opacity-90">
          🦴 Reporte de Salud Ósea &amp; Articular
        </p>
        <p className="text-lg font-bold">Artikare</p>
      </div>

      <div className="px-6 py-5 flex flex-col gap-5">
        <div className="flex justify-between gap-4">
          <div>
            <p className="text-xs text-muted uppercase tracking-wide">
              Edad real
            </p>
            <p className="text-2xl font-bold">{result.chronologicalAge} años</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted uppercase tracking-wide">
              Edad articular estimada
            </p>
            <p className="text-2xl font-bold">{result.articularAge} años</p>
          </div>
        </div>

        <div
          className={`rounded-xl border px-4 py-3 flex items-center gap-2 font-semibold ${riskStyles[result.riskLevel]}`}
        >
          <span className="text-lg" aria-hidden="true">{result.emoji}</span>
          <span>{result.label}</span>
        </div>

        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {result.message}
        </p>

        {/* Bandera roja: el reumatólogo va antes que cualquier estudio o suplemento. */}
        {needsRheumatologyReview && (
          <Link
            href="/citas"
            className={`w-full text-center rounded-xl bg-risk-high text-white font-semibold px-4 py-3 ${FOCUS_RING}`}
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

        <p className="text-xs text-muted">
          Este test es orientativo y no reemplaza un diagnóstico médico
          profesional. Consulta a tu especialista en reumatología.
        </p>

        <div className="flex flex-col gap-3 pt-2">
          <WhatsAppCta
            href={densitometriaLink}
            className={`w-full text-center rounded-xl bg-action-strong hover:bg-brand-dark active:scale-[0.98] text-white font-semibold px-4 py-3 transition-colors ${FOCUS_RING}`}
          >
            Agendar Densitometría por WhatsApp
          </WhatsAppCta>
          <WhatsAppCta
            href={supplementLink}
            className={`w-full text-center rounded-xl border-2 border-brand text-clinic hover:bg-pastel-mint font-semibold px-4 py-3 transition-colors ${FOCUS_RING}`}
          >
            Pedir mi Pack CQ Pharma por WhatsApp
          </WhatsAppCta>
          <ShareInviteActions />
          <button
            type="button"
            onClick={onRestart}
            className={`w-full text-center text-sm text-muted hover:text-neutral-700 dark:hover:text-neutral-300 px-4 py-2 ${FOCUS_RING}`}
          >
            Volver a hacer el test
          </button>
        </div>
      </div>
    </div>
  );
}
