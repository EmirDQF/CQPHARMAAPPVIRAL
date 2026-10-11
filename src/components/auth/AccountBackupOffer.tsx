"use client";

import { useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { isAccountSyncAvailable } from "@/lib/auth/features";
import {
  ACCOUNT_BACKUP_OFFER_COPY,
  accountBackupConsentStore,
  accountBackupOfferDismissedStore,
  dismissAccountBackupOffer,
  grantAccountBackupConsent,
  shouldOfferAccountBackup,
} from "@/lib/privacy/accountBackupConsent";
import { PRIVACY_POLICY_PATH } from "@/lib/privacy/consent";

const GRANTED_MESSAGE =
  "Respaldo activado: tus registros se copiarán a tu cuenta y seguirán también en este celular.";

/**
 * Oferta de respaldo en la cuenta (C3). La casilla empieza sin marcar
 * (Ley 29733) y siempre hay "Ahora no"; nada de Mi Panel viaja sin ella.
 */
export function AccountBackupOffer() {
  const titleId = useId();
  const authStatus = useAuthStatus();
  const consentState = useSyncExternalStore(
    accountBackupConsentStore.subscribe,
    accountBackupConsentStore.getSnapshot,
    accountBackupConsentStore.getServerSnapshot
  );
  const dismissedAt = useSyncExternalStore(
    accountBackupOfferDismissedStore.subscribe,
    accountBackupOfferDismissedStore.getSnapshot,
    accountBackupOfferDismissedStore.getServerSnapshot
  );
  const [hasAccepted, setHasAccepted] = useState(false);
  const [wasGranted, setWasGranted] = useState(false);
  const statusRef = useRef<HTMLParagraphElement>(null);

  // El formulario desaparece al activar: el foco va a la confirmación para que se anuncie.
  useLayoutEffect(() => {
    if (wasGranted) statusRef.current?.focus();
  }, [wasGranted]);

  if (wasGranted) {
    return (
      <p
        ref={statusRef}
        role="status"
        tabIndex={-1}
        className="rounded-xl bg-risk-low-bg text-risk-low px-4 py-3 font-semibold print:hidden"
      >
        {GRANTED_MESSAGE}
      </p>
    );
  }

  const isVisible = shouldOfferAccountBackup({
    authStatus,
    isSyncAvailable: isAccountSyncAvailable(),
    consentState,
    dismissedAt,
    now: new Date(),
  });
  if (!isVisible) return null;

  function handleActivate() {
    grantAccountBackupConsent();
    setWasGranted(true);
  }

  return (
    <section
      aria-labelledby={titleId}
      className="rounded-2xl border-2 border-brand/30 bg-brand-light/40 dark:bg-brand-dark/20 px-5 py-5 flex flex-col gap-3 print:hidden"
    >
      <h2 id={titleId} className="text-lg font-bold">
        {ACCOUNT_BACKUP_OFFER_COPY.title}
      </h2>
      <p className="text-neutral-700 dark:text-neutral-300">{ACCOUNT_BACKUP_OFFER_COPY.body}</p>
      <label className="flex items-start gap-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 px-4 py-3 cursor-pointer">
        <input
          type="checkbox"
          checked={hasAccepted}
          onChange={(event) => setHasAccepted(event.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 accent-brand"
        />
        <span className="text-sm">
          {ACCOUNT_BACKUP_OFFER_COPY.consentLabel}{" "}
          <a
            href={PRIVACY_POLICY_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand underline"
          >
            Política de Privacidad
          </a>
          .
        </span>
      </label>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => dismissAccountBackupOffer()}
          className="flex-1 min-h-12 rounded-xl border-2 border-neutral-300 dark:border-neutral-600 font-semibold"
        >
          {ACCOUNT_BACKUP_OFFER_COPY.dismiss}
        </button>
        <button
          type="button"
          onClick={handleActivate}
          disabled={!hasAccepted}
          className="flex-1 min-h-12 rounded-xl bg-action-strong hover:bg-brand-dark active:scale-[0.98] text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {ACCOUNT_BACKUP_OFFER_COPY.accept}
        </button>
      </div>
    </section>
  );
}
