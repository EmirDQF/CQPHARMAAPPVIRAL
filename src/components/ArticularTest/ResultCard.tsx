import Link from "next/link";
import type { RiskResult } from "@/lib/types";
import {
  buildDensitometriaWhatsAppLink,
  buildSupplementWhatsAppLink,
} from "@/lib/whatsapp";

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
    <div className="w-full max-w-md mx-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
      <div className="bg-brand text-white px-6 py-4">
        <p className="text-sm font-medium opacity-90">
          🦴 Reporte de Salud Ósea &amp; Articular
        </p>
        <p className="text-lg font-bold">Artikare</p>
      </div>

      <div className="px-6 py-5 flex flex-col gap-5">
        <div className="flex justify-between gap-4">
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wide">
              Edad real
            </p>
            <p className="text-2xl font-bold">{result.chronologicalAge} años</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500 uppercase tracking-wide">
              Edad articular estimada
            </p>
            <p className="text-2xl font-bold">{result.articularAge} años</p>
          </div>
        </div>

        <div
          className={`rounded-xl border px-4 py-3 flex items-center gap-2 font-semibold ${riskStyles[result.riskLevel]}`}
        >
          <span className="text-lg">{result.emoji}</span>
          <span>{result.label}</span>
        </div>

        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {result.message}
        </p>

        <div className="flex flex-col gap-2 text-sm">
          <div className="rounded-lg bg-neutral-100 dark:bg-neutral-900 px-4 py-3">
            <p className="font-medium">Estudio recomendado</p>
            <p className="text-neutral-600 dark:text-neutral-400">
              {result.diagnosticSuggestion}
            </p>
          </div>
          <div className="rounded-lg bg-neutral-100 dark:bg-neutral-900 px-4 py-3">
            <p className="font-medium">Nutrición celular recomendada</p>
            <p className="text-neutral-600 dark:text-neutral-400">
              {result.supplementProtocol}
            </p>
          </div>
        </div>

        <p className="text-xs text-neutral-500">
          Este test es orientativo y no reemplaza un diagnóstico médico
          profesional. Consulta a tu especialista en reumatología.
        </p>

        <div className="flex flex-col gap-3 pt-2">
          {needsRheumatologyReview && (
            <Link
              href="/citas"
              className="w-full text-center rounded-xl bg-risk-high text-white font-semibold px-4 py-3"
            >
              Agendar evaluación reumatológica
            </Link>
          )}
          <a
            href={densitometriaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold px-4 py-3 transition-colors"
          >
            Agendar Densitometría por WhatsApp
          </a>
          <a
            href={supplementLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center rounded-xl border-2 border-brand text-brand hover:bg-brand-light font-semibold px-4 py-3 transition-colors"
          >
            Pedir mi Pack CQ Pharma por WhatsApp
          </a>
          <button
            type="button"
            onClick={onRestart}
            className="w-full text-center text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 px-4 py-2"
          >
            Volver a hacer el test
          </button>
        </div>
      </div>
    </div>
  );
}
