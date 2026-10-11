"use client";

import { useSyncExternalStore } from "react";
import { useDeferredDose } from "@/hooks/useDeferredDose";
import { useHydrated } from "@/hooks/useHydrated";
import { useMinuteClock } from "@/hooks/useMinuteClock";
import { buildDayProgress, suggestNextAction } from "@/lib/dashboard/myDay";
import { painLogStore } from "@/lib/dashboard/painLog";
import { calculateStreak, pillboxStore } from "@/lib/dashboard/pillbox";
import { toLimaIsoDate } from "@/lib/utils/date";
import { PainCheckIn } from "../PainCheckIn";
import { PainTrendChart } from "../PainTrendChart";
import { SmartPillbox } from "../SmartPillbox";
import { useClinicalStatus } from "../useActiveRedFlags";
import { BoneSummaryCard } from "./BoneSummaryCard";
import { DayHeader } from "./DayHeader";
import { DayProgressRing } from "./DayProgressRing";
import { MyDaySkeleton } from "./MyDaySkeleton";
import { NextActionCard } from "./NextActionCard";

interface MyDayProps {
  firstName: string | null;
  onOpenBoneTab: () => void;
}

/** Pantalla principal de /app, escaneable en 5 segundos. La bandera roja la pinta AppShell por encima. */
export function MyDay({ firstName, onOpenBoneTab }: MyDayProps) {
  const isHydrated = useHydrated();
  const now = useMinuteClock();
  const pillbox = useSyncExternalStore(pillboxStore.subscribe, pillboxStore.getSnapshot, pillboxStore.getServerSnapshot);
  const painEntries = useSyncExternalStore(painLogStore.subscribe, painLogStore.getSnapshot, painLogStore.getServerSnapshot);
  const { boneScan, redFlags } = useClinicalStatus();
  const deferredDose = useDeferredDose();

  if (!isHydrated) return <MyDaySkeleton />;

  const today = toLimaIsoDate(now);
  const takenDoseIds = pillbox.takenDoseIdsByDate[today] ?? [];
  const checkInDone = painEntries.some((entry) => entry.date === today);
  const doneOrPending = [...takenDoseIds, ...deferredDose.pendingDoseIds];
  const hasHistory = Object.values(pillbox.takenDoseIdsByDate).some((doseIds) => doseIds.length > 0);
  const nextAction = suggestNextAction({
    hasRedFlag: redFlags.length > 0,
    takenDoseIds: doneOrPending,
    checkInDone,
    hasBoneScan: boneScan !== null,
    now,
  });

  return (
    <div className="flex flex-col gap-5">
      <DayHeader firstName={firstName} streak={calculateStreak(pillbox, now)} hasHistory={hasHistory} now={now} />
      <section aria-label="Tu progreso de hoy" className="rounded-card bg-pastel-mint text-pastel-mint-ink px-5 py-5">
        <DayProgressRing progress={buildDayProgress(doneOrPending, checkInDone)} />
      </section>
      <NextActionCard action={nextAction} onOpenBoneTab={onOpenBoneTab} />
      <SmartPillbox
        takenDoseIds={takenDoseIds}
        pendingDoseIds={deferredDose.pendingDoseIds}
        onTake={deferredDose.take}
        onUndo={deferredDose.undo}
        now={now}
      />
      <PainCheckIn />
      <PainTrendChart />
      <BoneSummaryCard scan={boneScan} onOpenBoneTab={onOpenBoneTab} />
    </div>
  );
}
