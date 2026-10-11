"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { DOSE_SCHEDULE } from "@/lib/clinical/constants";
import { formatTime24hForDisplay } from "@/lib/utils/date";
import { PainCheckIn } from "../PainCheckIn";

type Sheet = "dose" | "pain" | null;

interface QuickActionsProps {
  /** Tomas ya anotadas hoy (guardadas o en ventana de deshacer). */
  doneOrPendingDoseIds: readonly string[];
  onTake: (doseId: string) => void;
}

const CHIP_CLASS =
  "min-h-12 shrink-0 rounded-full border-2 border-line bg-surface px-4 font-semibold text-clinic transition-transform duration-150 active:scale-[0.97]";

function DoseSheetBody({ doneOrPendingDoseIds, onTake, onDone }: QuickActionsProps & { onDone: () => void }) {
  const pending = DOSE_SCHEDULE.filter((dose) => !doneOrPendingDoseIds.includes(dose.id));
  if (pending.length === 0) return <p className="font-medium">Ya anotaste todas tus tomas de hoy.</p>;
  return (
    <ul className="flex flex-col gap-3">
      {pending.map((dose) => (
        <li key={dose.id} className="flex flex-col gap-2 rounded-card bg-pastel-lemon text-pastel-lemon-ink px-4 py-3">
          <p className="font-semibold">
            {formatTime24hForDisplay(dose.time)} · {dose.label}
          </p>
          <button
            type="button"
            onClick={() => {
              onTake(dose.id);
              onDone();
            }}
            className="min-h-12 rounded-control bg-action-strong text-on-action-strong font-bold active:scale-[0.98] transition-transform duration-150"
          >
            Ya me la tomé
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Chips de acción rápida: registrar toma o dolor desde una hoja inferior, sin buscar la tarjeta. */
export function QuickActions(props: QuickActionsProps) {
  const [sheet, setSheet] = useState<Sheet>(null);
  const [savedMessage, setSavedMessage] = useState("");
  const close = () => setSheet(null);
  return (
    <>
      <div role="group" aria-label="Acciones rápidas" className="flex gap-2 overflow-x-auto pb-1">
        <button type="button" className={CHIP_CLASS} onClick={() => setSheet("dose")}>
          <span aria-hidden="true">💊 </span>Anotar toma
        </button>
        <button type="button" className={CHIP_CLASS} onClick={() => setSheet("pain")}>
          <span aria-hidden="true">📝 </span>Chequeo de dolor
        </button>
      </div>
      <p role="status" className="sr-only">
        {savedMessage}
      </p>
      {sheet === "dose" && (
        <BottomSheet title="Anotar toma" onClose={close}>
          <DoseSheetBody {...props} onDone={close} />
        </BottomSheet>
      )}
      {sheet === "pain" && (
        <BottomSheet title="Chequeo de hoy" onClose={close}>
          <PainCheckIn
            anchorId={null}
            onSaved={() => {
              close();
              setSavedMessage("Chequeo de hoy guardado.");
            }}
          />
        </BottomSheet>
      )}
    </>
  );
}
