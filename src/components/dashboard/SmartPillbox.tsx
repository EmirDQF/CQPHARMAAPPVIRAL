"use client";

import { DOSE_SCHEDULE, UNDO_WINDOW_MS } from "@/lib/clinical/constants";
import { doseSlotStatus } from "@/lib/dashboard/myDay";
import type { DosePeriod, DoseSchedule } from "@/lib/dashboard/types";
import { formatTime24hForDisplay } from "@/lib/utils/date";

const MS_PER_SECOND = 1000;
const UNDO_SECONDS = UNDO_WINDOW_MS / MS_PER_SECOND;

const PERIOD_STYLE: Record<DosePeriod, { card: string; icon: string; name: string }> = {
  morning: { card: "bg-pastel-lemon text-pastel-lemon-ink", icon: "☀️", name: "Mañana" },
  night: { card: "bg-pastel-lavender text-pastel-lavender-ink", icon: "🌙", name: "Noche" },
};

const STATUS_TEXT = { due: "Te toca ahora", upcoming: "Más tarde", taken: "Tomada hoy" } as const;

interface SmartPillboxProps {
  takenDoseIds: readonly string[];
  pendingDoseIds: readonly string[];
  onTake: (doseId: string) => void;
  onUndo: (doseId: string) => void;
  now: Date | null;
}

interface DoseSlotCardProps {
  dose: DoseSchedule;
  isTaken: boolean;
  isPending: boolean;
  onTake: () => void;
  onUndo: () => void;
  now: Date | null;
}

function DoseSlotCard({ dose, isTaken, isPending, onTake, onUndo, now }: DoseSlotCardProps) {
  const style = PERIOD_STYLE[dose.period];
  const status = now ? doseSlotStatus(dose.time, isTaken || isPending, now) : null;
  return (
    <li className={`rounded-card px-4 py-4 flex flex-col gap-3 ${style.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold">
            <span aria-hidden="true">{style.icon} </span>
            {style.name} · {formatTime24hForDisplay(dose.time)}
          </p>
          <p className="text-lg font-semibold">{dose.label}</p>
        </div>
        <span className="rounded-full bg-surface/70 px-3 py-1 text-sm font-bold whitespace-nowrap">{status ? STATUS_TEXT[status] : " "}</span>
      </div>
      {isTaken && <p className="min-h-14 flex items-center font-bold">✓ Tomada</p>}
      {isPending && (
        <div className="min-h-14 flex items-center justify-between gap-3">
          <p className="font-bold">✓ Anotada</p>
          <button
            type="button"
            onClick={onUndo}
            className="min-h-12 rounded-control border-2 border-current px-4 font-semibold"
          >
            Deshacer ({UNDO_SECONDS} s)
          </button>
        </div>
      )}
      {!isTaken && !isPending && (
        <button
          type="button"
          onClick={onTake}
          className="min-h-14 rounded-control bg-action-strong text-on-action-strong text-lg font-bold px-5 transition-transform duration-150 active:scale-[0.98]"
        >
          Ya me la tomé
        </button>
      )}
    </li>
  );
}

/** Pastillero por franja (08:30 y 21:30 de Lima). Cada franja cuenta una sola vez al día. */
export function SmartPillbox({ takenDoseIds, pendingDoseIds, onTake, onUndo, now }: SmartPillboxProps) {
  const pendingIds = pendingDoseIds.filter((id) => !takenDoseIds.includes(id));
  return (
    <section
      id="pastillero"
      aria-labelledby="pastillero-heading"
      className="rounded-card border border-line bg-surface shadow-soft px-5 py-5 flex flex-col gap-4 scroll-mt-24"
    >
      <h2 id="pastillero-heading" className="text-xl font-bold text-clinic">Pastillero Inteligente</h2>
      <ul className="flex flex-col gap-3">
        {DOSE_SCHEDULE.map((dose) => (
          <DoseSlotCard
            key={dose.id}
            dose={dose}
            isTaken={takenDoseIds.includes(dose.id)}
            isPending={pendingIds.includes(dose.id)}
            onTake={() => onTake(dose.id)}
            onUndo={() => onUndo(dose.id)}
            now={now}
          />
        ))}
      </ul>
      <p role="status" className="sr-only">
        {pendingIds.length > 0 ? `Toma anotada. Puedes deshacerla durante ${UNDO_SECONDS} segundos.` : ""}
      </p>
      <p className="text-sm text-muted">
        La constancia diaria apoya tu salud articular y ósea. Tus suplementos complementan, no reemplazan, el tratamiento
        indicado por tu médico.
      </p>
    </section>
  );
}
