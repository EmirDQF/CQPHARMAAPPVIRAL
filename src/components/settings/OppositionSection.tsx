"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import {
  accountBackupConsentStore,
  hasCurrentAccountBackupConsent,
  revokeAccountBackupConsent,
} from "@/lib/privacy/accountBackupConsent";
import { PRIVACY_POLICY_PATH } from "@/lib/privacy/consent";
import { SettingsCard } from "./SettingsCard";

/** Derecho de oposición: retirar el respaldo en la cuenta y saber cómo oponerse a lo demás. */
export function OppositionSection() {
  const backupConsent = useSyncExternalStore(
    accountBackupConsentStore.subscribe,
    accountBackupConsentStore.getSnapshot,
    accountBackupConsentStore.getServerSnapshot
  );
  const [isConfirming, setIsConfirming] = useState(false);
  const [wasRevoked, setWasRevoked] = useState(false);
  const isBackupActive = hasCurrentAccountBackupConsent(backupConsent);

  function handleRevoke() {
    revokeAccountBackupConsent();
    setIsConfirming(false);
    setWasRevoked(true);
  }

  return (
    <SettingsCard
      id="ajustes-oponerse"
      title="Retirar autorizaciones"
      description="Derecho de oposición: puedes retirar en cualquier momento las autorizaciones que diste, sin perder lo que guardas en este celular."
    >
      {isBackupActive && !isConfirming && (
        <button
          type="button"
          onClick={() => setIsConfirming(true)}
          className="min-h-12 rounded-xl border-2 border-brand text-clinic font-semibold px-5"
        >
          Dejar de respaldar mis registros en la cuenta
        </button>
      )}
      {isBackupActive && isConfirming && (
        <div className="flex flex-col gap-3 rounded-xl bg-canvas p-4">
          <p className="text-lg">
            Tus registros seguirán en este celular. Lo ya respaldado queda en tu cuenta hasta que la borres.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={handleRevoke} className="min-h-12 rounded-xl btn-primary font-bold px-5">
              Sí, dejar de respaldar
            </button>
            <button
              type="button"
              onClick={() => setIsConfirming(false)}
              className="min-h-12 rounded-xl border-2 border-neutral-300 dark:border-neutral-700 font-semibold px-5"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      {!isBackupActive && (
        <p role={wasRevoked ? "status" : undefined} className="text-lg font-medium">
          {wasRevoked
            ? "Listo: dejamos de respaldar tus registros en la cuenta."
            : "El respaldo en la cuenta está desactivado: Mi Panel se guarda solo en este celular."}
        </p>
      )}
      <p className="text-lg text-muted">
        Los recordatorios se desactivan desde los permisos de notificaciones de tu celular. Para oponerte a cualquier
        otro uso de tus datos, escríbenos por el canal indicado en la{" "}
        <Link href={PRIVACY_POLICY_PATH} className="text-clinic font-semibold underline">
          Política de Privacidad
        </Link>
        .
      </p>
    </SettingsCard>
  );
}
