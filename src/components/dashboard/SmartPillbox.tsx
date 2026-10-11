"use client";

import { BellRing, CheckCircle2, Clock, Moon, Pill, Sun, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DOSE_SCHEDULE } from "@/lib/clinical/constants";
import { doseSlotStatus, type DoseSlotStatus } from "@/lib/dashboard/myDay";
import type { DosePeriod, DoseSchedule } from "@/lib/dashboard/types";
import { formatTime24hForDisplay } from "@/lib/utils/date";

interface PeriodStyle {
  card: string;
  iconTile: string;
  icon: LucideIcon;
  name: string;
}

const PERIOD_STYLE: Record<DosePeriod, PeriodStyle> = {
  morning: { card: "bg-pastel-lemon text-pastel-lemon-ink", iconTile: "bg-surface/70", icon: Sun, name: "Mañana" },
  night: { card: "bg-pastel-lavender text-pastel-lavender-ink", iconTile: "bg-surface/70", icon: Moon, name: "Noche" },
};

const STATUS_BADGE: Record<DoseSlotStatus, { text: string; icon: LucideIcon; className: string }> = {
  due: { text: "Te toca ahora", icon: BellRing, className: "bg-action-strong text-on-action-strong" },
  upcoming: { text: "Más tarde", icon: Clock, className: "bg-surface/80 text-current" },
  taken: { text: "Tomada hoy", icon: CheckCircle2, className: "bg-pastel-mint text-pastel-mint-ink" },
};

interface SmartPillboxProps {
  takenDoseIds: readonly string[];
  pendingDoseIds: readonly string[];
  onTake: (doseId: string) => void;
  onUndo: (doseId: string) => void;
  onConfirm: (doseId: string) => void;
  lastConfirmedDoseId: string | null;
  now: Date | null;
}

interface DoseSlotCardProps {
  dose: DoseSchedule;
  isTaken: boolean;
  isPending: boolean;
  onTake: () => void;
  onUndo: () => void;
  onConfirm: () => void;
  now: Date | null;
}

function DoseStatusBadge({ status }: { status: DoseSlotStatus }) {
  const badge = STATUS_BADGE[status];
  const Icon = badge.icon;
  return (
    <Badge size="lg" className={`shrink-0 font-bold whitespace-nowrap ${badge.className}`}>
      <Icon aria-hidden="true" />
      {badge.text}
    </Badge>
  );
}

function PendingConfirmation({ onUndo, onConfirm }: Pick<DoseSlotCardProps, "onUndo" | "onConfirm">) {
  return (
    <div className="flex flex-col gap-2 animate-fade-in">
      <p className="flex items-center gap-2 font-bold">
        <CheckCircle2 aria-hidden="true" className="size-5 shrink-0" />
        Anotada. ¿Todo bien?
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="touch"
          onClick={onUndo}
          className="border-2 border-current bg-transparent text-current hover:bg-surface/60 hover:text-current"
        >
          Deshacer
        </Button>
        <Button type="button" size="touch" onClick={onConfirm} className="font-bold">
          Listo
        </Button>
      </div>
    </div>
  );
}

function DoseSlotCard({ dose, isTaken, isPending, onTake, onUndo, onConfirm, now }: DoseSlotCardProps) {
  const style = PERIOD_STYLE[dose.period];
  const PeriodIcon = style.icon;
  // Durante la ventana de deshacer no se afirma "Tomada hoy": aún no se guardó.
  const status = now && !isPending ? doseSlotStatus(dose.time, isTaken, now) : null;
  const isDue = status === "due";
  return (
    <li
      className={`rounded-card px-4 py-4 flex flex-col gap-3 transition-shadow duration-200 ${style.card} ${
        isDue ? "ring-2 ring-action-strong shadow-soft" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-bold">
          <span className={`grid size-9 shrink-0 place-items-center rounded-control ${style.iconTile}`} aria-hidden="true">
            <PeriodIcon className="size-5" />
          </span>
          {style.name} · {formatTime24hForDisplay(dose.time)}
        </p>
        {status && <DoseStatusBadge status={status} />}
      </div>
      <p className="text-lg font-semibold leading-snug">{dose.label}</p>
      {isTaken && (
        <p className="min-h-14 flex items-center gap-2 rounded-control bg-surface/60 px-4 font-bold">
          <CheckCircle2 aria-hidden="true" className="size-6 shrink-0" />
          <span>Tomada</span>
        </p>
      )}
      {isPending && <PendingConfirmation onUndo={onUndo} onConfirm={onConfirm} />}
      {!isTaken && !isPending && (
        <Button type="button" size="xl" onClick={onTake} className="w-full">
          <Pill aria-hidden="true" />
          Ya me la tomé
        </Button>
      )}
    </li>
  );
}

/** Pastillero por franja (08:30 y 21:30 de Lima). Cada franja cuenta una sola vez al día. */
function statusMessage(pendingCount: number, lastConfirmedLabel: string | null): string {
  if (pendingCount > 0) return "Toma anotada. Puedes deshacerla o pulsar Listo para guardarla.";
  return lastConfirmedLabel ? `Toma guardada: ${lastConfirmedLabel}.` : "";
}

export function SmartPillbox(props: SmartPillboxProps) {
  const { takenDoseIds, pendingDoseIds, onTake, onUndo, onConfirm, lastConfirmedDoseId, now } = props;
  const pendingIds = pendingDoseIds.filter((id) => !takenDoseIds.includes(id));
  const takenCount = DOSE_SCHEDULE.filter((dose) => takenDoseIds.includes(dose.id)).length;
  return (
    <section
      id="pastillero"
      aria-labelledby="pastillero-heading"
      className="rounded-card border border-line bg-surface shadow-soft px-5 py-5 flex flex-col gap-4 scroll-mt-24"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="pastillero-heading" className="text-xl font-bold text-clinic">Pastillero Inteligente</h2>
        <Badge variant={takenCount === DOSE_SCHEDULE.length ? "mint" : "sky"} size="lg" className="shrink-0">
          {takenCount} de {DOSE_SCHEDULE.length} hoy
        </Badge>
      </div>
      <ul className="flex flex-col gap-3">
        {DOSE_SCHEDULE.map((dose) => (
          <DoseSlotCard
            key={dose.id}
            dose={dose}
            isTaken={takenDoseIds.includes(dose.id)}
            isPending={pendingIds.includes(dose.id)}
            onTake={() => onTake(dose.id)}
            onUndo={() => onUndo(dose.id)}
            onConfirm={() => onConfirm(dose.id)}
            now={now}
          />
        ))}
      </ul>
      <p role="status" className="sr-only">
        {statusMessage(pendingIds.length, DOSE_SCHEDULE.find((dose) => dose.id === lastConfirmedDoseId)?.label ?? null)}
      </p>
      <p className="text-sm text-muted">
        La constancia diaria apoya tu salud articular y ósea. Tus suplementos complementan, no reemplazan, el tratamiento
        indicado por tu médico.
      </p>
    </section>
  );
}
