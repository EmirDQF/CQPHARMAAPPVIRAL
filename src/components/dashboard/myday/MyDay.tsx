"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import type { DeferredDose } from "@/hooks/useDeferredDose";
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
import { NextActionCard } from "./NextActionCard";
import { QuickActions } from "./QuickActions";

interface MyDayProps {
  firstName: string | null;
  onOpenBoneTab: () => void;
  /** Tomas anotadas con deshacer: viven en AppShell para que cambiar de pestaña no las confirme. */
  deferredDose: DeferredDose;
  /** Celebración de logro nuevo: va justo después del saludo. */
  celebration?: ReactNode;
  /** Avisos secundarios: se pintan junto con el resto tras hidratar, para no saltar sobre el esqueleto (CLS). */
  footer?: ReactNode;
}

/** Pantalla principal de /app, escaneable en 5 segundos. La bandera roja la pinta AppShell por encima. */
export function MyDay({ firstName, onOpenBoneTab, deferredDose, celebration, footer }: MyDayProps) {
  const isHydrated = useHydrated();
  const now = useMinuteClock();
  const pillbox = useSyncExternalStore(pillboxStore.subscribe, pillboxStore.getSnapshot, pillboxStore.getServerSnapshot);
  const painEntries = useSyncExternalStore(painLogStore.subscribe, painLogStore.getSnapshot, painLogStore.getServerSnapshot);
  const { boneScan, redFlags } = useClinicalStatus();

  const today = now ? toLimaIsoDate(now) : null;
  const takenDoseIds = (today && pillbox.takenDoseIdsByDate[today]) || [];
  const checkInDone = painEntries.some((entry) => entry.date === today);
  const doneOrPending = [...takenDoseIds, ...deferredDose.pendingDoseIds];
  const hasHistory = Object.values(pillbox.takenDoseIdsByDate).some((doseIds) => doseIds.length > 0);
  const nextAction = now
    ? suggestNextAction({
        hasRedFlag: redFlags.length > 0,
        takenDoseIds: doneOrPending,
        checkInDone,
        hasBoneScan: boneScan !== null,
        now,
      })
    : null;

  return (
    <div className="flex flex-col gap-5">
      <DayHeader
        firstName={firstName}
        streak={isHydrated && now ? calculateStreak(pillbox, now) : null}
        hasHistory={hasHistory}
        now={now}
      />
      {celebration}
      <section aria-label="Tu progreso de hoy" className="rounded-card bg-pastel-mint text-pastel-mint-ink px-5 py-5">
        <DayProgressRing progress={buildDayProgress(doneOrPending, checkInDone)} />
      </section>
      <NextActionCard action={nextAction} onOpenBoneTab={onOpenBoneTab} />
      <QuickActions doneOrPendingDoseIds={doneOrPending} onTake={deferredDose.take} />
      <SmartPillbox
        takenDoseIds={takenDoseIds}
        pendingDoseIds={deferredDose.pendingDoseIds}
        onTake={deferredDose.take}
        onUndo={deferredDose.undo}
        onConfirm={deferredDose.confirm}
        lastConfirmedDoseId={deferredDose.lastConfirmedDoseId}
        now={now}
      />
      <PainCheckIn />
      <PainTrendChart />
      <BoneSummaryCard scan={boneScan} onOpenBoneTab={onOpenBoneTab} />
      {footer}
    </div>
  );
}
