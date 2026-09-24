"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { NextAppointmentCard } from "@/components/appointments/NextAppointmentCard";
import { usePillboxReminders } from "@/hooks/usePillboxReminders";
import { appointmentsStore, getNextUpcomingAppointment } from "@/lib/appointments/store";
import { calculateStreakDays, pillboxStore } from "@/lib/dashboard/pillbox";
import { ClinicalReportExport } from "./ClinicalReportExport";
import { DailyCompletionCelebration } from "./DailyCompletionCelebration";
import { DailyReinforcementBanner } from "./DailyReinforcementBanner";
import { DexaVaultSection } from "./DexaVaultSection";
import { InstallPwaBanner } from "./InstallPwaBanner";
import { PainCheckIn } from "./PainCheckIn";
import { PainTrendChart } from "./PainTrendChart";
import { PatientProfileLauncher } from "./PatientProfileLauncher";
import { RedFlagBanner } from "./RedFlagBanner";
import { RestockAlert } from "./RestockAlert";
import { SmartPillbox } from "./SmartPillbox";
import { TreatmentTracker } from "./TreatmentTracker";

type TabId = "hoy" | "hueso" | "tratamiento" | "reumatologo";

interface TabDefinition {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: TabDefinition[] = [
  { id: "hoy", label: "Hoy", icon: "📅" },
  { id: "hueso", label: "Mi Hueso", icon: "🦴" },
  { id: "tratamiento", label: "Tratamiento", icon: "💊" },
  { id: "reumatologo", label: "Reumatólogo", icon: "🩺" },
];

export function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>("hoy");
  usePillboxReminders();

  const pillboxState = useSyncExternalStore(
    pillboxStore.subscribe,
    pillboxStore.getSnapshot,
    pillboxStore.getServerSnapshot
  );
  const streakDays = calculateStreakDays(pillboxState);

  const appointments = useSyncExternalStore(
    appointmentsStore.subscribe,
    appointmentsStore.getSnapshot,
    appointmentsStore.getServerSnapshot
  );
  const nextAppointment = getNextUpcomingAppointment(appointments);
  const patientFirstName = nextAppointment?.patient.name.split(" ")[0] ?? null;

  return (
    <div className="flex flex-col min-h-dvh">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-neutral-200 dark:border-neutral-800 px-4 py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-bold">
              Hola{patientFirstName ? `, ${patientFirstName}` : ""} 👋
            </p>
            <p className="text-sm text-neutral-500">Tu salud ósea, en un solo lugar.</p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 rounded-full bg-brand-light dark:bg-brand-dark/30 px-3 py-2"
              aria-label={`Racha activa: ${streakDays} días`}
            >
              <span className="text-xl animate-pulse" aria-hidden="true">
                🔥
              </span>
              <span className="font-bold text-brand-dark dark:text-brand-light">
                {streakDays}
              </span>
            </div>
            <PatientProfileLauncher />
          </div>
        </div>
        <InstallPwaBanner />
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 pb-28 flex flex-col gap-6 text-base sm:text-lg">
        <RedFlagBanner />

        {activeTab === "hoy" && (
          <>
            <PainCheckIn />
            <SmartPillbox />
            <DailyCompletionCelebration />
            <DailyReinforcementBanner />
            <PainTrendChart />
          </>
        )}

        {activeTab === "hueso" && <DexaVaultSection />}

        {activeTab === "tratamiento" && (
          <>
            <TreatmentTracker />
            <RestockAlert />
          </>
        )}

        {activeTab === "reumatologo" && (
          <>
            <NextAppointmentCard />
            {nextAppointment && (
              <Link
                href="/citas"
                className="min-h-12 flex items-center justify-center rounded-xl border-2 border-brand text-brand font-semibold px-5 transition-colors hover:bg-brand-light dark:hover:bg-brand-dark/30"
              >
                Agendar otra cita
              </Link>
            )}
            <ClinicalReportExport />
            <Link
              href="/app/reporte-medico"
              className="min-h-12 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 font-semibold px-5 transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700"
            >
              🖨️ Ver Ficha Imprimible para tu Médico
            </Link>
          </>
        )}
      </main>

      <nav
        aria-label="Navegación principal"
        className="fixed bottom-0 inset-x-0 z-40 bg-background border-t border-neutral-200 dark:border-neutral-800 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="max-w-2xl mx-auto grid grid-cols-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={`min-h-16 flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors ${
                activeTab === tab.id
                  ? "text-brand"
                  : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              <span className="text-2xl" aria-hidden="true">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
