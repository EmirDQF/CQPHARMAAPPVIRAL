"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { consumeLocalDeletionDone } from "@/lib/privacy/arco";
import { CONSENT_VERSION, PRIVACY_POLICY_PATH } from "@/lib/privacy/consent";
import { AccountDeletionSection } from "./AccountDeletionSection";
import { DataExportSection } from "./DataExportSection";
import { FeedbackPreferencesSection } from "./FeedbackPreferencesSection";
import { SmartRemindersSection } from "./SmartRemindersSection";
import { OppositionSection } from "./OppositionSection";
import { RectificationSection } from "./RectificationSection";

// La marca de "borrado hecho" se lee una sola vez por carga de página.
let deletionNotice: boolean | null = null;
function readDeletionNotice(): boolean {
  deletionNotice ??= consumeLocalDeletionDone(window.sessionStorage);
  return deletionNotice;
}
const subscribeToNothing = () => () => {};

/** Ajustes: los cuatro derechos ARCO (Ley 29733) a la vista, sin trámites ni pasos ocultos. */
export function SettingsScreen() {
  const authStatus = useAuthStatus();
  const wasJustDeleted = useSyncExternalStore(subscribeToNothing, readDeletionNotice, () => false);

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8 pb-28 flex flex-col gap-6">
      <Link href="/app" className="text-sm text-clinic font-semibold">
        ← Volver a Mi Panel
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold">Ajustes y privacidad</h1>
        <p className="text-base text-neutral-700 dark:text-neutral-300">
          Tus derechos sobre tus datos (Ley N.º 29733): acceder, corregir, retirar autorizaciones y borrar. Todo se
          hace aquí mismo.
        </p>
      </header>

      {wasJustDeleted && (
        <p role="status" className="rounded-2xl bg-pastel-mint px-5 py-4 text-base font-semibold">
          Listo: borramos tus datos de este celular y, si tenías cuenta, también la cuenta.
        </p>
      )}

      <SmartRemindersSection />
      <FeedbackPreferencesSection />
      <DataExportSection authStatus={authStatus} />
      <RectificationSection />
      <OppositionSection />
      <AccountDeletionSection authStatus={authStatus} />

      <p className="text-sm text-muted">
        <Link href={PRIVACY_POLICY_PATH} className="text-clinic font-semibold underline">
          Política de Privacidad
        </Link>{" "}
        · Versión {CONSENT_VERSION}
      </p>
    </main>
  );
}
