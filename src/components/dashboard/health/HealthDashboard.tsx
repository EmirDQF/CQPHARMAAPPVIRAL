"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { NextAppointmentCard } from "@/components/appointments/NextAppointmentCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { useGame } from "@/hooks/useGame";
import { useMinuteClock } from "@/hooks/useMinuteClock";
import { DOSE_SCHEDULE } from "@/lib/clinical/constants";
import { adherencePercent, pickNextBestAction, type NextBestActionId } from "@/lib/dashboard/healthSummary";
import { doseSlotStatus } from "@/lib/dashboard/myDay";
import { painLogStore } from "@/lib/dashboard/painLog";
import { pillboxStore } from "@/lib/dashboard/pillbox";
import type { PillboxState } from "@/lib/dashboard/types";
import type { GameStats } from "@/lib/gamification/engine";
import { DexaVaultSection } from "../DexaVaultSection";
import { PainTrendChart } from "../PainTrendChart";
import { RestockAlert } from "../RestockAlert";
import { TreatmentTracker } from "../TreatmentTracker";
import { useClinicalStatus } from "../useActiveRedFlags";
import { HealthDashboardSkeleton } from "./HealthDashboardSkeleton";
import { NextBestActionCard } from "./NextBestActionCard";
import { StiffnessSummary } from "./StiffnessSummary";

export type HealthTarget = "hoy" | "aprender" | "jugar";

interface HealthDashboardProps {
  onNavigate: (target: HealthTarget) => void;
}

const WEEK = 7;
const MONTH = 30;
const BONE_SECTION_ID = "boveda-dexa";

function RingsRow({ now, stats, takenDoseIdsByDate }: { now: Date; stats: GameStats; takenDoseIdsByDate: PillboxState["takenDoseIdsByDate"] }) {
  const week = adherencePercent(takenDoseIdsByDate, now, WEEK);
  const month = adherencePercent(takenDoseIdsByDate, now, MONTH);
  const levelPercent = Math.round((stats.level.xpIntoLevel / stats.level.xpForLevel) * 100);
  return (
    <section aria-labelledby="constancia" className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5 shadow-soft">
      <h2 id="constancia" className="text-xl font-bold text-clinic">
        Tu constancia
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ProgressRing percent={week} value={`${week}%`} label="Tomas 7 días" ariaLabel={`Tomas anotadas en 7 días: ${week} por ciento`} tone="vital" />
        <ProgressRing percent={month} value={`${month}%`} label="Tomas 30 días" ariaLabel={`Tomas anotadas en 30 días: ${month} por ciento`} tone="sky" />
        <ProgressRing percent={Math.min(100, (stats.streak.days / WEEK) * 100)} value={`${stats.streak.days}`} label="Días de racha" ariaLabel={`Racha: ${stats.streak.days} días`} tone="streak" />
        <ProgressRing percent={levelPercent} value={`N${stats.level.level}`} label={`${stats.xp} XP`} ariaLabel={`Nivel ${stats.level.level}, ${stats.xp} XP en total`} tone="xp" />
      </div>
    </section>
  );
}

/** "Mi salud": siguiente paso, semáforo óseo, constancia, lo registrado, citas y tratamiento. */
export function HealthDashboard({ onNavigate }: HealthDashboardProps) {
  const now = useMinuteClock();
  // Sin hora real (prerender/hidratación) se muestra el esqueleto, nunca datos de otro día.
  if (!now) return <HealthDashboardSkeleton />;
  return <HealthDashboardContent now={now} onNavigate={onNavigate} />;
}

function HealthDashboardContent({ now, onNavigate }: HealthDashboardProps & { now: Date }) {
  const router = useRouter();
  const { boneScan, redFlags } = useClinicalStatus();
  const pillbox = useSyncExternalStore(pillboxStore.subscribe, pillboxStore.getSnapshot, pillboxStore.getServerSnapshot);
  const painEntries = useSyncExternalStore(painLogStore.subscribe, painLogStore.getSnapshot, painLogStore.getServerSnapshot);
  const game = useGame(now);
  const today = game.today;
  const taken = pillbox.takenDoseIdsByDate[today] ?? [];
  const action = pickNextBestAction({
    hasRedFlag: redFlags.length > 0,
    hasBoneScan: boneScan !== null,
    checkedInToday: painEntries.some((entry) => entry.date === today),
    pendingDoseNow: DOSE_SCHEDULE.some((dose) => doseSlotStatus(dose.time, taken.includes(dose.id), now) === "due"),
    learnedToday: (game.progress.learning[today] ?? []).length > 0,
  });

  const handlers: Record<NextBestActionId, () => void> = {
    evaluacion: () => router.push("/citas"),
    toma: () => onNavigate("hoy"),
    chequeo: () => onNavigate("hoy"),
    densitometria: () => {
      // El foco sigue al desplazamiento: teclado y lector de pantalla llegan a la Bóveda DEXA.
      const target = document.getElementById(BONE_SECTION_ID);
      target?.scrollIntoView({ block: "start" });
      target?.focus();
    },
    aprender: () => onNavigate("aprender"),
    descanso: () => onNavigate("jugar"),
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-black text-clinic">Mi salud</h1>
      <NextBestActionCard action={action} onAct={handlers[action.id]} />
      <div id={BONE_SECTION_ID} tabIndex={-1} aria-label="Densitometría y Semáforo Óseo" className="scroll-mt-24">
        <DexaVaultSection />
      </div>
      <RingsRow now={now} stats={game.stats} takenDoseIdsByDate={pillbox.takenDoseIdsByDate} />
      <PainTrendChart />
      <StiffnessSummary now={now} />
      <NextAppointmentCard />
      <TreatmentTracker />
      <RestockAlert />
    </div>
  );
}
