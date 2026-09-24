"use client";

import { useLayoutEffect, useRef, type ReactNode, type SyntheticEvent } from "react";

interface ModalDialogProps {
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Diálogo modal nativo: `showModal()` vuelve inerte el resto de la página,
 * mantiene el foco dentro, cierra con Escape y devuelve el foco al botón que
 * lo abrió. Se monta solo mientras está abierto.
 */
export function ModalDialog({ labelledBy, onClose, children }: ModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Layout effect: el cierre ocurre antes de quitar el nodo, así el navegador restaura el foco.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => dialog.close();
  }, []);

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    // Escape: el padre desmonta el diálogo para que su estado quede sincronizado.
    event.preventDefault();
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      onCancel={handleCancel}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 text-foreground backdrop:bg-black/50"
    >
      <div className="flex h-full items-end sm:items-center justify-center px-4 py-6">
        <div className="w-full max-w-lg max-h-full overflow-y-auto rounded-2xl bg-background border-2 border-neutral-200 dark:border-neutral-800 px-6 py-6 flex flex-col gap-5">
          {children}
        </div>
      </div>
    </dialog>
  );
}
