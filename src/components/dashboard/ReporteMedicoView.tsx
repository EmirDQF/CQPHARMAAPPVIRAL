"use client";

import Link from "next/link";
import { Activity, ArrowLeft, CalendarPlus, ClipboardList, Printer, Stethoscope, TriangleAlert, Upload, UserRound, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
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
  "no-segura": "No está segura",
  "no-decir": "Prefiere no decirlo",
};

const semaphoreDot: Record<RiskLevel, string> = {
  bajo: "bg-risk-low",
  moderado: "bg-risk-moderate",
  alto: "bg-risk-high",
};

const semaphoreText: Record<RiskLevel, string> = {
  bajo: "text-risk-low",
  moderado: "text-risk-moderate",
  alto: "text-risk-high",
};

const SECTION_CARD =
  "rounded-card border border-line bg-surface shadow-soft print:shadow-none print:border-2 print:border-black px-5 py-5";

interface SectionTitleProps {
  icon: LucideIcon;
  children: ReactNode;
}

function SectionTitle({ icon: Icon, children }: SectionTitleProps) {
  return (
    <h2 className="flex items-center gap-2 font-bold text-clinic print:text-black">
      <Icon aria-hidden="true" className="size-5 shrink-0 print:hidden" />
      {children}
    </h2>
  );
}

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
          <Link
            href="/app"
            className="min-h-12 inline-flex items-center gap-1.5 rounded-control px-2 text-sm font-semibold text-clinic hover:bg-pastel-sky"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Volver a mi panel
          </Link>
          <Button type="button" size="touch" onClick={() => window.print()} className="shrink whitespace-normal text-center">
            <Printer aria-hidden="true" />
            Imprimir / Guardar en PDF
          </Button>
        </div>

        <header className="border-b-2 border-clinic print:border-black pb-4">
          <p className="text-lg font-bold text-clinic print:text-black">Artikare • Respaldo Clínico CQ Pharma</p>
          <h1 className="text-[1.75rem] font-extrabold tracking-tight">Reporte Osteoarticular</h1>
          <p className="text-base text-muted print:text-black mt-1">
            Generado el {formatGeneratedDate()}
          </p>
        </header>

        <section className={`${SECTION_CARD} grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm`}>
          <div className="sm:col-span-2 mb-1">
            <SectionTitle icon={UserRound}>Datos del paciente</SectionTitle>
          </div>
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
          <p className="sm:col-span-2">
            <span className="font-semibold">Alergias conocidas: </span>
            {profile.allergies.trim().length > 0 ? profile.allergies : "Ninguna reportada"}
          </p>
        </section>

        {scan ? (
          <section className={`${SECTION_CARD} flex flex-col gap-2`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-lg font-semibold">
                Densitometría más reciente: {formatScanDate(scan.scanDate)}
              </p>
              {scan.riskLevel ? (
                <span aria-hidden="true" className={`size-5 shrink-0 rounded-full ${semaphoreDot[scan.riskLevel]}`} />
              ) : (
                <Stethoscope aria-hidden="true" className="size-5 shrink-0 text-muted" />
              )}
            </div>
            <p className="text-base font-medium uppercase tracking-wide">
              Peor T-Score (lumbar / cuello femoral)
            </p>
            <p className="text-4xl font-extrabold">{scan.worstTScore.toFixed(1)}</p>
            <p className={`font-bold uppercase print:text-black ${scan.riskLevel ? semaphoreText[scan.riskLevel] : ""}`}>
              {scan.diagnosisLabel}
            </p>
            <p className="text-lg">{scan.diagnosisMessage}</p>
            {scan.profileNote && (
              <p role="note" className="flex items-start gap-2 text-lg font-semibold">
                <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span>
                  <span className="sr-only">Aviso: </span>
                  {scan.profileNote}
                </span>
              </p>
            )}
          </section>
        ) : (
          <section className="rounded-card border-2 border-dashed border-line bg-surface print:border-black px-5 py-5 flex flex-col gap-3">
            <p className="font-bold">Sin densitometría registrada</p>
            <div className="flex flex-col sm:flex-row gap-3 print:hidden">
              <Button type="button" size="touch" onClick={() => setIsDexaModalOpen(true)} className="flex-1">
                <Upload aria-hidden="true" />
                Sube tu densitometría
              </Button>
              <Link
                href="/citas"
                className="min-h-12 flex-1 flex items-center justify-center gap-2 rounded-control border-2 border-brand text-clinic font-semibold px-4 transition-all hover:bg-pastel-mint active:scale-[0.98]"
              >
                <CalendarPlus aria-hidden="true" className="size-5" />
                Agendar densitometría
              </Link>
            </div>
          </section>
        )}

        <div className="print:break-inside-avoid">
          <PainTrendChart />
        </div>

        <section className={`${SECTION_CARD} flex flex-col gap-1`}>
          <SectionTitle icon={Activity}>Seguimiento de 30 días</SectionTitle>
          <p className="text-lg font-semibold">
            Adherencia a suplementación CQ Pharma (30 días): {summary.adherencePercent}%
          </p>
          <p className="text-lg">
            Dolor promedio reportado:{" "}
            {summary.averagePainLevel !== null
              ? `${summary.averagePainLevel}/10 (${summary.daysTracked} días registrados)`
              : "Sin registros de dolor en los últimos 30 días"}
          </p>
        </section>

        <section className={`${SECTION_CARD} flex flex-col gap-2`}>
          <SectionTitle icon={ClipboardList}>Observaciones para el especialista</SectionTitle>
          <ul className="list-disc pl-5 flex flex-col gap-1 text-sm">
            {observations.map((observation) => (
              <li key={observation}>{observation}</li>
            ))}
          </ul>
        </section>

        <p className="text-base text-muted print:text-black">
          Este reporte es generado por el paciente a partir de su seguimiento en la app Artikare
          y no reemplaza una evaluación clínica presencial.
        </p>

        <AccountInvite moment="reporte" />
      </div>
      <DexaVaultModal isOpen={isDexaModalOpen} onClose={() => setIsDexaModalOpen(false)} />
    </div>
  );
}
