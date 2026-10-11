"use client";

import { DOSE_SCHEDULE } from "@/lib/clinical/constants";
import { doseSlotStatus } from "@/lib/dashboard/myDay";
import type { DosePeriod, DoseSchedule } from "@/lib/dashboard/types";
import { formatTime24hForDisplay } from "@/lib/utils/date";

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

function DoseSlotCard({ dose, isTaken, isPending, onTake, onUndo, onConfirm, now }: DoseSlotCardProps) {
  const style = PERIOD_STYLE[dose.period];
  // Durante la ventana de deshacer no se afirma "Tomada hoy": aún no se guardó.
  const status = now && !isPending ? doseSlotStatus(dose.time, isTaken, now) : null;
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
        {status && (
          <span className="rounded-full bg-surface/70 px-3 py-1 text-sm font-bold whitespace-nowrap">{STATUS_TEXT[status]}</span>
        )}
      </div>
      {isTaken && <p className="min-h-14 flex items-center font-bold">✓ Tomada</p>}
      {isPending && (
        <div className="flex flex-col gap-2">
          <p className="font-bold">✓ Anotada. ¿Todo bien?</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={onUndo} className="min-h-12 rounded-control border-2 border-current px-3 font-semibold">
              Deshacer
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="min-h-12 rounded-control bg-action-strong text-on-action-strong px-3 font-bold active:scale-[0.98] transition-transform duration-150"
            >
              Listo
            </button>
          </div>
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
function statusMessage(pendingCount: number, lastConfirmedLabel: string | null): string {
  if (pendingCount > 0) return "Toma anotada. Puedes deshacerla o pulsar Listo para guardarla.";
  return lastConfirmedLabel ? `Toma guardada: ${lastConfirmedLabel}.` : "";
}

export function SmartPillbox(props: SmartPillboxProps) {
  const { takenDoseIds, pendingDoseIds, onTake, onUndo, onConfirm, lastConfirmedDoseId, now } = props;
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
