"use client";

import { useState } from "react";
import { ModalDialog } from "@/components/ui/ModalDialog";
import type { AuthStatus } from "@/lib/auth/types";
import { clearLocalPersonalData, markLocalDeletionDone } from "@/lib/privacy/arco";
import { hasServerSession, requestAccountDeletion } from "@/lib/privacy/arcoRequests";
import { SettingsCard } from "./SettingsCard";

type DeletionPhase = "idle" | "confirming" | "deleting" | "failed";

interface AccountDeletionSectionProps {
  authStatus: AuthStatus;
  /** Recarga tras borrar, para que ningún dato en memoria vuelva a guardarse. */
  onDeleted?: () => void;
}

const DIALOG_TITLE_ID = "borrar-datos-titulo";
const DIALOG_DESCRIPTION_ID = "borrar-datos-descripcion";
const CONFIRM_HINT_ID = "borrar-datos-ayuda";

function reloadSettings(): void {
  window.location.replace("/app/ajustes");
}

/** Derecho de cancelación: borra la cuenta (si existe) y todo lo de este celular. */
export function AccountDeletionSection({ authStatus, onDeleted = reloadSettings }: AccountDeletionSectionProps) {
  const [phase, setPhase] = useState<DeletionPhase>("idle");
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const hasAccountData = hasServerSession(authStatus);

  function closeDialog() {
    setPhase("idle");
    setIsAcknowledged(false);
  }

  async function handleDelete() {
    setPhase("deleting");
    // Primero la cuenta: si falla, el celular queda intacto y se puede reintentar.
    if (hasAccountData && !(await requestAccountDeletion())) {
      setPhase("failed");
      return;
    }
    clearLocalPersonalData(window.localStorage);
    markLocalDeletionDone(window.sessionStorage);
    onDeleted();
  }

  return (
    <SettingsCard
      id="ajustes-borrar"
      title="Borrar mi cuenta y mis datos"
      description="Derecho de cancelación: borra de forma definitiva todo lo que Artikare guarda de ti. Te recomendamos descargar tus datos antes."
    >
      <button
        type="button"
        onClick={() => setPhase("confirming")}
        disabled={authStatus === "loading"}
        className="min-h-12 rounded-xl border-2 border-red-600 text-red-700 dark:text-red-400 font-semibold px-5 disabled:opacity-60"
      >
        Borrar mi cuenta y mis datos
      </button>

      {phase !== "idle" && (
        <ModalDialog labelledBy={DIALOG_TITLE_ID} describedBy={DIALOG_DESCRIPTION_ID} onClose={closeDialog}>
          <h2 id={DIALOG_TITLE_ID} className="text-xl font-bold">
            ¿Borrar todos tus datos?
          </h2>
          <ul id={DIALOG_DESCRIPTION_ID} className="list-disc pl-5 flex flex-col gap-1 text-base">
            <li>De este celular: perfil, diario de dolor, tomas, frascos, densitometrías, citas y test.</li>
            {hasAccountData && <li>De tu cuenta: la cuenta y todos sus registros, de forma definitiva.</li>}
            <li>No se puede deshacer.</li>
          </ul>
          <label className="flex items-start gap-3 text-base">
            <input
              type="checkbox"
              checked={isAcknowledged}
              onChange={(event) => setIsAcknowledged(event.target.checked)}
              className="mt-1 h-5 w-5 shrink-0"
            />
            <span>Entiendo que el borrado es definitivo.</span>
          </label>
          {!isAcknowledged && (
            <p id={CONFIRM_HINT_ID} className="text-lg text-muted">
              Marca la casilla para activar el botón de borrado.
            </p>
          )}
          {phase === "failed" && (
            <p role="alert" className="text-lg font-medium text-red-700 dark:text-red-400">
              No pudimos borrar tu cuenta. No borramos nada de este celular; revisa tu conexión e inténtalo de nuevo.
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!isAcknowledged || phase === "deleting"}
              aria-describedby={isAcknowledged ? undefined : CONFIRM_HINT_ID}
              className="min-h-12 rounded-xl bg-red-700 text-white font-semibold px-5 disabled:opacity-50"
            >
              {phase === "deleting" ? "Borrando…" : "Borrar definitivamente"}
            </button>
            <button
              type="button"
              // Foco inicial en la acción segura: nadie borra por pulsar Enter al abrir.
              autoFocus
              onClick={closeDialog}
              disabled={phase === "deleting"}
              className="min-h-12 rounded-xl border-2 border-neutral-300 dark:border-neutral-700 font-semibold px-5"
            >
              Cancelar
            </button>
          </div>
        </ModalDialog>
      )}
    </SettingsCard>
  );
}
