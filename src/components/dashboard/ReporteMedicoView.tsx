"use client";

import Link from "next/link";
import { AccountInvite } from "@/components/auth/AccountInvite";
import { useMemo, useState, useSyncExternalStore } from "react";
import { appointmentsStore, getNextUpcomingAppointment } from "@/lib/appointments/store";
import { painLogStore } from "@/lib/dashboard/painLog";
import { pillboxStore } from "@/lib/dashboard/pillbox";
import { CLINIC_TIME_ZONE } from "@/lib/clinical/constants";
import { RED_FLAG_DESCRIPTION } from "@/lib/clinical/redFlags";
import type { MenopausalStatus } from "@/lib/clinical/tScoreEligibility";
import { buildClinicalReportSummary, describeStiffnessChange } from "@/lib/storage/clinicalReport";
import type { BoneScanSummary } from "@/lib/dashboard/types";
import type { RiskLevel } from "@/lib/types";
import { DexaVaultModal } from "./DexaVaultModal";
import { PainTrendChart } from "./PainTrendChart";
import { useClinicalStatus } from "./useActiveRedFlags";

const MENOPAUSAL_STATUS_LABEL: Record<MenopausalStatus, string> = {
  premenopausica: "Premenopáusica",
  posmenopausica: "Posmenopáusica",
  "no-aplica": "No aplica / No sabe",
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
    year: "numeric",
  });
}

function describeScanObservation(scan: BoneScanSummary | null): string {
  if (!scan) return "Sin densitometría registrada por el paciente.";
  if (scan.interpretation === "z-score-required") {
    return "Semáforo OMS por T-score no aplicable (mujer premenopáusica u hombre < 50 años): requiere interpretación médica con Z-score.";
  }
  return `Clasificación OMS por peor T-score: ${scan.diagnosisLabel}.`;
}

function describeFractureHistory(hasFractureHistory: boolean | null): string {
  if (hasFractureHistory === null) return "No registrado";
  return hasFractureHistory ? "Sí" : "No";
}

function formatGeneratedDate(): string {
  return new Date().toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: CLINIC_TIME_ZONE,
  });
}

export function ReporteMedicoView() {
  const [isDexaModalOpen, setIsDexaModalOpen] = useState(false);

  const { profile, boneScan: scan, redFlags } = useClinicalStatus();

  const appointments = useSyncExternalStore(
    appointmentsStore.subscribe,
    appointmentsStore.getSnapshot,
    appointmentsStore.getServerSnapshot
  );
  const nextAppointment = getNextUpcomingAppointment(appointments);

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

  const patientName = profile.name || nextAppointment?.patient.name || "Paciente Artikare";
  const patientAge = profile.age ?? nextAppointment?.patient.age ?? null;
  const patientPhone = profile.phone || nextAppointment?.patient.phone || null;

  const observations: string[] = [
    describeScanObservation(scan),
    summary.stiffnessReductionPercent !== null
      ? `La rigidez matutina reportada ${describeStiffnessChange(summary.stiffnessReductionPercent)} en el periodo evaluado.`
      : "Aún no hay suficientes días de registro para calcular la variación de rigidez matutina.",
    `Adherencia a la suplementación CQ Pharma en los últimos 30 días: ${summary.adherencePercent}%.`,
  ];
  for (const flag of redFlags) {
    observations.push(`Bandera roja: ${RED_FLAG_DESCRIPTION[flag]}`);
  }
  if (scan?.profileNote) observations.push(scan.profileNote);
  if (profile.hasFractureHistory === true) {
    observations.push("Paciente con antecedente de fractura: seguimiento reumatológico prioritario.");
  } else if (profile.hasFractureHistory === null) {
    observations.push("Antecedente de fractura: no registrado por el paciente.");
  }
  if (profile.allergies.trim().length > 0) {
    observations.push(`Alergias conocidas: ${profile.allergies}.`);
  }

  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <div className="w-full max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6 print:px-0 print:py-0 print:max-w-none">
        <div className="flex items-center justify-between gap-3 print:hidden">
          <Link href="/app" className="text-sm font-semibold text-brand">
            ← Volver a mi panel
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-12 rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold px-5 transition-colors"
          >
            <span aria-hidden="true">🖨️ </span>Imprimir / Guardar en PDF
          </button>
        </div>

        <header className="border-b-2 border-neutral-900 dark:border-neutral-100 print:border-black pb-4">
          <p className="text-lg font-bold">Artikare • Respaldo Clínico CQ Pharma</p>
          <p className="text-neutral-600 dark:text-neutral-300 print:text-black">
            Reporte Osteoarticular
          </p>
          <p className="text-xs text-neutral-500 print:text-black mt-1">
            Generado el {formatGeneratedDate()}
          </p>
        </header>

        <section className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <p>
            <span className="font-semibold">Paciente: </span>
            {patientName}
          </p>
          <p>
            <span className="font-semibold">Edad: </span>
            {patientAge ?? "No registrada"}
          </p>
          <p>
            <span className="font-semibold">Sexo: </span>
            {profile.sex ?? "No registrado"}
          </p>
          <p>
            <span className="font-semibold">Peso aproximado: </span>
            {profile.weightKg !== null ? `${profile.weightKg} kg` : "No registrado"}
          </p>
          {profile.sex === "femenino" && (
            <p>
              <span className="font-semibold">Estado menopáusico: </span>
              {profile.menopausalStatus
                ? MENOPAUSAL_STATUS_LABEL[profile.menopausalStatus]
                : "No registrado"}
            </p>
          )}
          <p>
            <span className="font-semibold">Antecedente de fractura: </span>
            {describeFractureHistory(profile.hasFractureHistory)}
          </p>
          <p>
            <span className="font-semibold">Teléfono de contacto: </span>
            {patientPhone ?? "No registrado"}
          </p>
          <p className="col-span-2">
            <span className="font-semibold">Alergias conocidas: </span>
            {profile.allergies.trim().length > 0 ? profile.allergies : "Ninguna reportada"}
          </p>
        </section>

        {scan ? (
          <section className="rounded-2xl border-2 border-neutral-300 dark:border-neutral-700 print:border-black px-6 py-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                Densitometría más reciente: {formatScanDate(scan.scanDate)}
              </p>
              <span className="text-2xl" aria-hidden="true">
                {scan.riskLevel ? semaphoreEmoji[scan.riskLevel] : "🩺"}
              </span>
            </div>
            <p className="text-xs font-medium uppercase tracking-wide">
              Peor T-Score (lumbar / cuello femoral)
            </p>
            <p className="text-4xl font-extrabold">{scan.worstTScore.toFixed(1)}</p>
            <p className="font-semibold uppercase">{scan.diagnosisLabel}</p>
            <p className="text-sm">{scan.diagnosisMessage}</p>
            {scan.profileNote && (
              <p role="note" className="text-sm font-semibold">
                <span aria-hidden="true">⚠️ </span>
                <span className="sr-only">Aviso: </span>
                {scan.profileNote}
              </p>
            )}
          </section>
        ) : (
          <section className="rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 print:border-black px-6 py-5 flex flex-col gap-3">
            <p className="font-bold">Sin densitometría registrada</p>
            <div className="flex flex-col sm:flex-row gap-3 print:hidden">
              <button
                type="button"
                onClick={() => setIsDexaModalOpen(true)}
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
        )}

        <div className="print:break-inside-avoid">
          <PainTrendChart />
        </div>

        <section className="rounded-2xl border-2 border-neutral-300 dark:border-neutral-700 print:border-black px-6 py-5">
          <p className="text-sm font-semibold">
            Adherencia a suplementación CQ Pharma (30 días): {summary.adherencePercent}%
          </p>
          <p className="text-sm">
            Dolor promedio reportado:{" "}
            {summary.averagePainLevel !== null
              ? `${summary.averagePainLevel}/10 (${summary.daysTracked} días registrados)`
              : "Sin registros de dolor en los últimos 30 días"}
          </p>
        </section>

        <section className="rounded-2xl border-2 border-neutral-300 dark:border-neutral-700 print:border-black px-6 py-5 flex flex-col gap-2">
          <p className="font-bold">Observaciones para el especialista</p>
          <ul className="list-disc pl-5 flex flex-col gap-1 text-sm">
            {observations.map((observation) => (
              <li key={observation}>{observation}</li>
            ))}
          </ul>
        </section>

        <p className="text-xs text-neutral-400 print:text-black">
          Este reporte es generado por el paciente a partir de su seguimiento en la app Artikare
          y no reemplaza una evaluación clínica presencial.
        </p>

        <AccountInvite moment="reporte" />
      </div>
      <DexaVaultModal isOpen={isDexaModalOpen} onClose={() => setIsDexaModalOpen(false)} />
    </div>
  );
}
