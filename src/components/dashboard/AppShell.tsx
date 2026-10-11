"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { NextAppointmentCard } from "@/components/appointments/NextAppointmentCard";
import { AccountBackupOffer } from "@/components/auth/AccountBackupOffer";
import { AccountInvite } from "@/components/auth/AccountInvite";
import { usePillboxReminders } from "@/hooks/usePillboxReminders";
import { useRewards } from "@/hooks/useRewards";
import { AchievementsShowcase } from "@/components/rewards/AchievementsShowcase";
import { RewardCelebration } from "@/components/rewards/RewardCelebration";
import { appointmentsStore, getNextUpcomingAppointment } from "@/lib/appointments/store";
import { calculateStreakDays, pillboxStore } from "@/lib/dashboard/pillbox";
import { ClinicalRecordsManager } from "./ClinicalRecordsManager";
import { ClinicalReportExport } from "./ClinicalReportExport";
import { DailyReinforcementBanner } from "./DailyReinforcementBanner";
import { DexaVaultSection } from "./DexaVaultSection";
import { MyDay } from "./myday/MyDay";
import { InstallPwaBanner } from "./InstallPwaBanner";
import { PatientProfileLauncher } from "./PatientProfileLauncher";
import { RedFlagBanner } from "./RedFlagBanner";
import { ReminderOffer } from "./ReminderOffer";
import { RestockAlert } from "./RestockAlert";
import { TreatmentTracker } from "./TreatmentTracker";

type TabId = "hoy" | "hueso" | "tratamiento" | "logros" | "reumatologo";

interface TabDefinition {
  id: TabId;
  label: string;
  icon: string;
}

// Orden y nombres de la navegación inferior (los id internos no cambian).
const TABS: TabDefinition[] = [
  { id: "hoy", label: "Mi día", icon: "📅" },
  { id: "tratamiento", label: "Pastillero", icon: "💊" },
  { id: "hueso", label: "Progreso", icon: "🦴" },
  { id: "logros", label: "Logros", icon: "🏅" },
  { id: "reumatologo", label: "Médico", icon: "🩺" },
];

export function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>("hoy");
  const reminders = usePillboxReminders();
  const rewards = useRewards();

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
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-line px-4 py-3 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-extrabold text-clinic">
            <span aria-hidden="true">🦴 </span>Artikare
          </p>
          <div className="flex items-center gap-2">
            <PatientProfileLauncher />
            <Link
              href="/app/ajustes"
              aria-label="Ajustes y privacidad"
              className="min-h-12 min-w-12 flex items-center justify-center rounded-full text-xl bg-pastel-sky"
            >
              <span aria-hidden="true">⚙️</span>
            </Link>
          </div>
        </div>
        <InstallPwaBanner />
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 pb-28 flex flex-col gap-6 text-base sm:text-lg">
        <RedFlagBanner />

        {/* Transición suave al cambiar de pestaña (200 ms; nada con movimiento reducido). */}
        <div key={activeTab} className="flex flex-col gap-6 motion-safe:animate-fade-in">

        {activeTab === "hoy" && (
          <>
            <MyDay
              firstName={patientFirstName}
              onOpenBoneTab={() => setActiveTab("hueso")}
              celebration={
                <RewardCelebration
                  celebrations={rewards.celebrations}
                  onDismiss={rewards.dismissCelebrations}
                  onOpenAchievements={() => setActiveTab("logros")}
                />
              }
            />
            {reminders.shouldOffer && reminders.support && (
              <ReminderOffer
                support={reminders.support}
                onEnable={reminders.requestPermission}
                onSnooze={reminders.snooze}
              />
            )}
            <DailyReinforcementBanner />
            <AccountBackupOffer />
            <AccountInvite moment="racha" streakDays={streakDays} />
          </>
        )}

        {activeTab === "hueso" && <DexaVaultSection />}

        {activeTab === "logros" && <AchievementsShowcase rewards={rewards} />}

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
            <ClinicalRecordsManager />
          </>
        )}
        </div>
      </main>

      <nav
        aria-label="Navegación principal"
        className="fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-line shadow-soft pb-[env(safe-area-inset-bottom)]"
      >
        <div className="max-w-2xl mx-auto grid grid-cols-5">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className="min-h-16 flex flex-col items-center justify-center gap-0.5 px-1 text-xs font-semibold"
              >
                <span
                  aria-hidden="true"
                  className={`flex h-8 w-12 items-center justify-center rounded-full text-xl transition-colors duration-200 ${
                    isActive ? "bg-pastel-mint" : ""
                  }`}
                >
                  {tab.icon}
                </span>
                <span className={isActive ? "text-clinic font-bold" : "text-muted"}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
