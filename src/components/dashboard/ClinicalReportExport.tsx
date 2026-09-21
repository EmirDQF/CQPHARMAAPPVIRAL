"use client";

import { useMemo, useSyncExternalStore } from "react";
import { painLogStore } from "@/lib/dashboard/painLog";
import { pillboxStore } from "@/lib/dashboard/pillbox";
import {
  buildClinicalReportSummary,
  formatClinicalReportText,
} from "@/lib/storage/clinicalReport";
import { buildClinicalReportWhatsAppLink } from "@/lib/whatsapp";

export function ClinicalReportExport() {
  const painEntries = useSyncExternalStore(
    painLogStore.subscribe,
    painLogStore.getSnapshot,
    painLogStore.getServerSnapshot
  );
  const pillboxState = useSyncExternalStore(
    pillboxStore.subscribe,
    pillboxStore.getSnapshot,
    pillboxStore.getServerSnapshot
  );

  const summary = useMemo(
    () => buildClinicalReportSummary(painEntries, pillboxState),
    [painEntries, pillboxState]
  );
  const reportText = useMemo(() => formatClinicalReportText(summary), [summary]);
  const whatsAppLink = buildClinicalReportWhatsAppLink(reportText);

  function handleDownload() {
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `artikare-informe-clinico-${new Date().toISOString().slice(0, 10)}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 px-6 py-6 flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold">Informe para tu Reumatólogo</h2>
        <p className="text-sm text-neutral-500">
          Dolor promedio {summary.averagePainLevel}/10 · Adherencia{" "}
          {summary.adherencePercent}%
          {summary.stiffnessReductionPercent !== null &&
            ` · Rigidez -${summary.stiffnessReductionPercent}%`}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={whatsAppLink}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-12 flex items-center justify-center rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold px-4 flex-1 transition-colors"
        >
          Compartir por WhatsApp
        </a>
        <button
          type="button"
          onClick={handleDownload}
          className="min-h-12 flex items-center justify-center rounded-xl border-2 border-brand text-brand font-semibold px-4 flex-1"
        >
          Descargar informe
        </button>
      </div>
    </section>
  );
}
