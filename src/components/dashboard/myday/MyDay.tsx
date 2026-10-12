"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import type { DeferredDose } from "@/hooks/useDeferredDose";
import { useGame } from "@/hooks/useGame";
import { useSmartReminders } from "@/hooks/useSmartReminders";
import { InAppNudge } from "@/components/today/InAppNudge";
import { useMinuteClock } from "@/hooks/useMinuteClock";
import { pillboxStore } from "@/lib/dashboard/pillbox";
import { toLimaIsoDate } from "@/lib/utils/date";
import { ArtikoShowcase, GameUnlockToast } from "@/components/today/ArtikoShowcase";
import { MissionBoard } from "@/components/today/MissionBoard";
import { ShareCorner } from "@/components/today/ShareCorner";
import { TodayHero } from "@/components/today/TodayHero";
import { PainCheckIn } from "../PainCheckIn";
import { PainTrendChart } from "../PainTrendChart";
import { SmartPillbox } from "../SmartPillbox";
import { useClinicalStatus } from "../useActiveRedFlags";
import { BoneSummaryCard } from "./BoneSummaryCard";

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

function openCheckIn() {
  const section = document.getElementById("chequeo");
  section?.scrollIntoView({ behavior: "smooth", block: "start" });
  section?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
}

/** Esqueleto del mismo alto mientras se lee la hora del celular (el HTML del build no lleva fecha ni racha). */
function TodaySkeleton() {
  return (
    <div aria-hidden="true" className="flex min-h-[26rem] flex-col gap-4 motion-safe:animate-pulse">
      <span className="h-10 w-3/4 rounded-2xl bg-pastel-sky" />
      <span className="h-32 rounded-2xl bg-pastel-mint" />
      <span className="h-28 rounded-2xl bg-pastel-lavender" />
    </div>
  );
}

function TodayBoard({ now, firstName, onOpenBoneTab, deferredDose, celebration, footer }: MyDayProps & { now: Date }) {
  const game = useGame(now, deferredDose.pendingDoseIds);
  const smartReminders = useSmartReminders(game);
  const pillbox = useSyncExternalStore(pillboxStore.subscribe, pillboxStore.getSnapshot, pillboxStore.getServerSnapshot);
  const { boneScan } = useClinicalStatus();
  const takenDoseIds = pillbox.takenDoseIdsByDate[toLimaIsoDate(now)] ?? [];

  return (
    <>
      <TodayHero game={game} firstName={firstName} now={now} />
      {smartReminders.inAppNudge && <InAppNudge message={smartReminders.inAppNudge} onDismiss={smartReminders.dismissInAppNudge} />}
      {celebration}
      <GameUnlockToast game={game} />
      <MissionBoard game={game} onTakeDose={deferredDose.take} onOpenCheckIn={openCheckIn} />
      <BoneSummaryCard scan={boneScan} onOpenBoneTab={onOpenBoneTab} />
      <SmartPillbox
        takenDoseIds={takenDoseIds}
        takenDoseIdsByDate={pillbox.takenDoseIdsByDate}
        pendingDoseIds={deferredDose.pendingDoseIds}
        onTake={deferredDose.take}
        onUndo={deferredDose.undo}
        onConfirm={deferredDose.confirm}
        lastConfirmedDoseId={deferredDose.lastConfirmedDoseId}
        now={now}
      />
      <PainCheckIn />
      <PainTrendChart />
      <ShareCorner game={game} />
      <ArtikoShowcase game={game} />
      {footer}
    </>
  );
}

/** Pantalla "Hoy con Artiko" de /app. La bandera roja y su CTA las pinta AppShell por encima de todo. */
export function MyDay(props: MyDayProps) {
  const now = useMinuteClock();
  return <div className="flex flex-col gap-5">{now ? <TodayBoard {...props} now={now} /> : <TodaySkeleton />}</div>;
}
