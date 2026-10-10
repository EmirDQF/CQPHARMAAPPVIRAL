"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { isAccountSyncAvailable } from "@/lib/auth/features";
import {
  accountBackupConsentStore,
  hasCurrentAccountBackupConsent,
} from "@/lib/privacy/accountBackupConsent";
import { runBrowserAccountSync } from "@/lib/supabase/browserSync";

/**
 * Respaldo de Mi Panel en la cuenta (C3): un pase al abrir la app, al
 * recuperar la conexión y al volver a la pestaña. Solo con el respaldo
 * encendido, una cuenta (no anónima) y el consentimiento `respaldo-cuenta`.
 */
export function SyncCoordinator() {
  const authStatus = useAuthStatus();
  const backupConsent = useSyncExternalStore(
    accountBackupConsentStore.subscribe,
    accountBackupConsentStore.getSnapshot,
    accountBackupConsentStore.getServerSnapshot
  );
  const consent =
    isAccountSyncAvailable() && authStatus === "account" && hasCurrentAccountBackupConsent(backupConsent)
      ? backupConsent.consent
      : null;

  useEffect(() => {
    if (!consent) return;

    const sync = () => {
      runBrowserAccountSync(consent).catch((error: unknown) => {
        console.error("[sync] No se pudo iniciar el respaldo", error instanceof Error ? error.name : "error desconocido");
      });
    };
    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") sync();
    };

    sync();
    window.addEventListener("online", sync);
    document.addEventListener("visibilitychange", syncWhenVisible);
    return () => {
      window.removeEventListener("online", sync);
      document.removeEventListener("visibilitychange", syncWhenVisible);
    };
  }, [consent]);

  return null;
}
