"use client";

import { useId, type ReactNode } from "react";
import { ModalDialog } from "./ModalDialog";

interface BottomSheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Hoja inferior accesible sobre el diálogo nativo (foco atrapado, Escape y
 * devolución del foco al botón que la abrió). En móvil se ancla abajo.
 */
export function BottomSheet({ title, onClose, children }: BottomSheetProps) {
  const titleId = useId();
  return (
    <ModalDialog labelledBy={titleId} onClose={onClose}>
      <div aria-hidden="true" className="mx-auto -mt-2 h-1.5 w-12 rounded-full bg-line" />
      <div className="flex items-center justify-between gap-3">
        <h2 id={titleId} className="text-xl font-bold text-clinic">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="min-h-12 min-w-12 rounded-full bg-pastel-sky text-pastel-sky-ink font-semibold px-4"
        >
          Cerrar
        </button>
      </div>
      {children}
    </ModalDialog>
  );
}
