"use client";

import Link from "next/link";
import { useId, useState, useSyncExternalStore } from "react";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import {
  ACCOUNT_INVITE_COPY,
  accountInviteDismissedStore,
  dismissAccountInvite,
  shouldShowAccountInvite,
  type AccountInviteMoment,
} from "@/lib/auth/accountInvite";
import { isAccountSyncAvailable } from "@/lib/auth/features";
import { getEmailOtpChannel } from "@/lib/supabase/browserAuth";
import { AccessPanel } from "./AccessPanel";

interface AccountInviteProps {
  moment: AccountInviteMoment;
  streakDays?: number;
}

/** Invitación de respaldo a crear cuenta; nunca bloquea nada y siempre ofrece "Ahora no". */
export function AccountInvite({ moment, streakDays = 0 }: AccountInviteProps) {
  const titleId = useId();
  const dialogTitleId = useId();
  const authStatus = useAuthStatus();
  const dismissedAt = useSyncExternalStore(
    accountInviteDismissedStore.subscribe,
    accountInviteDismissedStore.getSnapshot,
    accountInviteDismissedStore.getServerSnapshot
  );
  const [isAccessOpen, setIsAccessOpen] = useState(false);

  const isVisible = shouldShowAccountInvite({
    moment,
    authStatus,
    streakDays,
    dismissedAt,
    isSyncAvailable: isAccountSyncAvailable(),
    now: new Date(),
  });
  // El diálogo sigue abierto aunque la cuenta recién creada oculte la invitación.
  if (!isVisible && !isAccessOpen) return null;

  return (
    <>
      {isVisible && (
        <section
          aria-labelledby={titleId}
          className="rounded-2xl border-2 border-brand/30 bg-brand-light/40 dark:bg-brand-dark/20 px-5 py-5 flex flex-col gap-3 print:hidden"
        >
          <h2 id={titleId} className="text-lg font-bold">
            {ACCOUNT_INVITE_COPY.title}
          </h2>
          <p className="text-neutral-700 dark:text-neutral-300">{ACCOUNT_INVITE_COPY.body}</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => dismissAccountInvite()}
              className="flex-1 min-h-12 rounded-xl border-2 border-neutral-300 dark:border-neutral-600 font-semibold"
            >
              {ACCOUNT_INVITE_COPY.dismiss}
            </button>
            <button
              type="button"
              onClick={() => setIsAccessOpen(true)}
              className="flex-1 min-h-12 rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold transition-colors"
            >
              {ACCOUNT_INVITE_COPY.accept}
            </button>
          </div>
          <Link href="/acceso" className="text-sm font-semibold text-brand self-start">
            {ACCOUNT_INVITE_COPY.signIn}
          </Link>
        </section>
      )}

      {isAccessOpen && (
        <ModalDialog labelledBy={dialogTitleId} onClose={() => setIsAccessOpen(false)}>
          <h2 id={dialogTitleId} className="text-xl font-bold">
            {ACCOUNT_INVITE_COPY.accept}
          </h2>
          <AccessPanel channel={getEmailOtpChannel()} />
          <button
            type="button"
            onClick={() => setIsAccessOpen(false)}
            className="min-h-12 rounded-xl border-2 border-neutral-300 dark:border-neutral-600 font-semibold"
          >
            Cerrar
          </button>
        </ModalDialog>
      )}
    </>
  );
}
