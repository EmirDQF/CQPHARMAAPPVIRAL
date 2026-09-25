"use client";

import { ModalDialog } from "@/components/ui/ModalDialog";

interface RecordDeleteDialogProps {
  warning: string;
  recordLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmación antes de borrar un registro que activa una bandera roja. */
export function RecordDeleteDialog({
  warning,
  recordLabel,
  onConfirm,
  onCancel,
}: RecordDeleteDialogProps) {
  return (
    <ModalDialog labelledBy="record-delete-title" onClose={onCancel}>
      <h2 id="record-delete-title" className="text-xl font-bold">
        ¿Borrar este registro?
      </h2>
      <p className="text-base">{recordLabel}</p>
      <p className="rounded-xl bg-risk-high-bg text-risk-high px-4 py-3 font-semibold">{warning}</p>
      <p className="text-sm text-neutral-500">Si lo borras, podrás deshacerlo durante 30 días.</p>
      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 min-h-12 rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 min-h-12 rounded-xl border-2 border-risk-high text-risk-high font-semibold"
        >
          Sí, borrar
        </button>
      </div>
    </ModalDialog>
  );
}
