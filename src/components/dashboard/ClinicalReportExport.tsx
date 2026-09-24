"use client";

import { useMemo, useSyncExternalStore } from "react";
import { RED_FLAG_DESCRIPTION } from "@/lib/clinical/redFlags";
import { painLogStore } from "@/lib/dashboard/painLog";
import { pillboxStore } from "@/lib/dashboard/pillbox";
import {
  buildClinicalReportSummary,
  describeStiffnessChange,
  formatClinicalReportText,
} from "@/lib/storage/clinicalReport";
import { toLimaIsoDate } from "@/lib/utils/date";
import { buildClinicalReportWhatsAppLink } from "@/lib/whatsapp";
import { useClinicalStatus } from "./useActiveRedFlags";

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

  // El texto descargado usa el mismo estado clínico que la app (perfil, Z-score, banderas rojas).
  const { profile, boneScan, redFlags } = useClinicalStatus();

  const summary = useMemo(
    () => buildClinicalReportSummary(painEntries, pillboxState),
    [painEntries, pillboxState]
  );
  const reportText = formatClinicalReportText(
    summary,
    boneScan,
    profile.hasFractureHistory,
    redFlags.map((flag) => RED_FLAG_DESCRIPTION[flag])
  );
  const whatsAppLink = buildClinicalReportWhatsAppLink();

  function handleDownload() {
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `artikare-informe-clinico-${toLimaIsoDate()}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 px-6 py-6 flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold">Informe para tu Reumatólogo</h2>
        <p className="text-sm text-neutral-500">
          {summary.averagePainLevel !== null
            ? `Dolor promedio ${summary.averagePainLevel}/10`
            : "Sin registros de dolor"}{" "}
          · Adherencia{" "}
          {summary.adherencePercent}%
          {summary.stiffnessReductionPercent !== null &&
            ` · Rigidez ${describeStiffnessChange(summary.stiffnessReductionPercent)}`}
        </p>
      </div>

      <p className="text-sm text-neutral-500">
        Descarga el informe y adjúntalo en WhatsApp: por tu privacidad, tus datos de salud no
        viajan dentro del enlace.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={whatsAppLink}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-12 flex items-center justify-center rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold px-4 flex-1 transition-colors"
        >
          Abrir WhatsApp
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
