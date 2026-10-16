"use client";

import { SoundToggle } from "@/components/ui/SoundToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BrandMark } from "@/components/brand/BrandMark";
import Link from "next/link";
import {
  BookOpen,
  CalendarPlus,
  Gamepad2,
  HeartPulse,
  Printer,
  Settings,
  Stethoscope,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { NextAppointmentCard } from "@/components/appointments/NextAppointmentCard";
import { AccountBackupOffer } from "@/components/auth/AccountBackupOffer";
import { AccountInvite } from "@/components/auth/AccountInvite";
import { usePillboxReminders } from "@/hooks/usePillboxReminders";
import { useDeferredDose } from "@/hooks/useDeferredDose";
import { useHydrated } from "@/hooks/useHydrated";
import { useRewards } from "@/hooks/useRewards";
import { FirstRunFlow } from "@/components/onboarding/FirstRunFlow";
import { ProfileCompletionOffer } from "@/components/onboarding/ProfileCompletionOffer";
import { ActiveBreak } from "@/components/today/ActiveBreak";
import { LearnHub } from "@/components/learn/LearnHub";
import { GamesHub } from "@/components/games/GamesHub";
import { patientProfileStore } from "@/lib/dashboard/patientProfile";
import { needsOnboarding, onboardingStore } from "@/lib/onboarding/onboarding";
import { AchievementsShowcase } from "@/components/rewards/AchievementsShowcase";
import { RewardCelebration } from "@/components/rewards/RewardCelebration";
import { appointmentsStore, getNextUpcomingAppointment } from "@/lib/appointments/store";
import { calculateStreakDays, pillboxStore } from "@/lib/dashboard/pillbox";
import { ClinicalRecordsManager } from "./ClinicalRecordsManager";
import { ClinicalReportExport } from "./ClinicalReportExport";
import { DailyReinforcementBanner } from "./DailyReinforcementBanner";
import { HealthDashboard } from "./health/HealthDashboard";
import { MyDay } from "./myday/MyDay";
import { InstallPwaBanner } from "./InstallPwaBanner";
import { PatientProfileLauncher } from "./PatientProfileLauncher";
import { RedFlagBanner } from "./RedFlagBanner";
import { ReminderOffer } from "./ReminderOffer";

type TabId = "hoy" | "salud" | "aprender" | "jugar" | "reumatologo";

interface TabDefinition {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

// Orden y nombres de la navegación inferior (los id internos no cambian).
const TABS: TabDefinition[] = [
  { id: "hoy", label: "Mi día", icon: Sun },
  { id: "salud", label: "Mi salud", icon: HeartPulse },
  { id: "aprender", label: "Aprender", icon: BookOpen },
  { id: "jugar", label: "Jugar", icon: Gamepad2 },
  { id: "reumatologo", label: "Médico", icon: Stethoscope },
];

/** Estas pestañas traen su propio h1 visible; el resto anuncia la vista para lectores de pantalla. */
const TABS_WITH_OWN_HEADING: ReadonlySet<TabId> = new Set(["hoy", "salud", "aprender", "jugar"]);

export function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>("hoy");
  const reminders = usePillboxReminders();
  const rewards = useRewards();
  const deferredDose = useDeferredDose();

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
  const profile = useSyncExternalStore(
    patientProfileStore.subscribe,
    patientProfileStore.getSnapshot,
    patientProfileStore.getServerSnapshot
  );
  const onboarding = useSyncExternalStore(onboardingStore.subscribe, onboardingStore.getSnapshot, onboardingStore.getServerSnapshot);
  const isHydrated = useHydrated();
  const patientFirstName =
    profile.name.trim().split(/\s+/)[0] || nextAppointment?.patient.name.split(" ")[0] || null;

  // Primer arranque: solo después de leer el celular (quien ya tiene perfil nunca lo ve).
  if (isHydrated && needsOnboarding(onboarding, profile)) return <FirstRunFlow />;

  return (
    <div className="ambient-canvas flex flex-col min-h-dvh">
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-line/70 px-4 py-3 flex flex-col gap-3">
        {/* Con letra grande los botones bajan a una segunda línea en vez de desbordar a 375 px. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-lg">
            <BrandMark />
          </p>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SoundToggle />
            <ThemeToggle />
            <PatientProfileLauncher />
            <Link
              href="/app/ajustes"
              aria-label="Ajustes y privacidad"
              className="min-h-12 min-w-12 flex items-center justify-center rounded-full bg-pastel-sky text-pastel-sky-ink transition-transform active:scale-95"
            >
              <Settings aria-hidden="true" className="size-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 pb-28 flex flex-col gap-6 text-lg">
        <RedFlagBanner />

        {/* Transición suave al cambiar de pestaña (200 ms; nada con movimiento reducido). */}
        <div key={activeTab} className="flex flex-col gap-6 motion-safe:stagger-in">
          {!TABS_WITH_OWN_HEADING.has(activeTab) && (
            <h1 className="sr-only">{TABS.find((tab) => tab.id === activeTab)?.label}</h1>
          )}

        {activeTab === "hoy" && (
          <>
            <MyDay
              firstName={patientFirstName}
              onOpenBoneTab={() => setActiveTab("salud")}
              deferredDose={deferredDose}
              celebration={
                <RewardCelebration
                  celebrations={rewards.celebrations}
                  onDismiss={rewards.dismissCelebrations}
                  onOpenAchievements={() => setActiveTab("jugar")}
                />
              }
              footer={
                <>
                  <ProfileCompletionOffer />
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
              }
            />
          </>
        )}

        {activeTab === "salud" && <HealthDashboard onNavigate={setActiveTab} />}

        {activeTab === "aprender" && <LearnHub />}

        {activeTab === "jugar" && <GamesHub achievements={<AchievementsShowcase rewards={rewards} />} />}

        {activeTab === "reumatologo" && (
          <>
            <NextAppointmentCard />
            {nextAppointment && (
              <Link
                href="/citas"
                className="min-h-12 flex items-center justify-center gap-2 rounded-control border-2 border-brand text-clinic font-semibold px-5 transition-all hover:bg-pastel-mint active:scale-[0.98]"
              >
                <CalendarPlus aria-hidden="true" className="size-5" />
                Agendar otra cita
              </Link>
            )}
            <ClinicalReportExport />
            <Link
              href="/app/reporte-medico"
              className="min-h-12 flex items-center justify-center gap-2 rounded-control border border-line bg-surface text-center text-clinic shadow-soft font-semibold px-5 py-2 transition-all hover:bg-pastel-sky active:scale-[0.98]"
            >
              <Printer aria-hidden="true" className="size-5" />
              Ver Ficha Imprimible para tu Médico
            </Link>
            <ClinicalRecordsManager />
          </>
        )}
        </div>

        {/* Al final y no en el encabezado: aparece después de hidratar y no debe empujar el contenido (CLS). */}
        <InstallPwaBanner />
        <ActiveBreak />
      </main>

      <nav
        aria-label="Navegación principal"
        className="fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-line shadow-soft pb-[env(safe-area-inset-bottom)]"
      >
        <div className="max-w-2xl mx-auto grid grid-cols-5">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className="min-h-16 flex flex-col items-center justify-center gap-0.5 px-1 text-xs font-semibold transition-transform active:scale-95"
              >
                <span
                  aria-hidden="true"
                  className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors duration-200 ${
                    isActive ? "bg-pastel-mint text-pastel-mint-ink" : "text-muted"
                  }`}
                >
                  <TabIcon className="size-5" strokeWidth={isActive ? 2.4 : 2} />
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
