import { z } from "zod";
import { enqueueOutboxRequest, flushOutbox } from "../api/outbox";
import { ACCOUNT_INVITE_SNOOZE_DAYS } from "../auth/accountInvite";
import type { AuthStatus } from "../auth/types";
import { createPersistentStore } from "../storage/persistentStore";
import { consentRecordSchema, createConsentRecord, isConsentCurrent, type ConsentRecord } from "./consent";

/**
 * Consentimiento `respaldo-cuenta` dado en este celular (C3). La política
 * vigente dice que Mi Panel solo se guarda en el dispositivo: sin este
 * consentimiento nada de Mi Panel viaja a la cuenta. El servidor vuelve a
 * comprobarlo en `consents` antes de escribir (no confía en el celular).
 */
export interface AccountBackupConsentState {
  consent: ConsentRecord | null;
}

const stateSchema = z.object({ consent: consentRecordSchema.nullable() });

export function parseAccountBackupConsent(raw: unknown): AccountBackupConsentState | null {
  const result = stateSchema.safeParse(raw);
  return result.success ? result.data : null;
}

export const accountBackupConsentStore = createPersistentStore<AccountBackupConsentState>(
  "artikare_account_backup_consent_v1",
  { consent: null },
  parseAccountBackupConsent
);

export function hasCurrentAccountBackupConsent(state: AccountBackupConsentState): boolean {
  return isConsentCurrent(state.consent ?? undefined);
}

/**
 * Copy de la oferta de respaldo. El texto del consentimiento dice qué se
 * respalda, dónde se aloja y que se puede retirar (pendiente de revisión
 * legal junto con /privacidad en C5).
 */
export const ACCOUNT_BACKUP_OFFER_COPY = {
  title: "Respalda tus registros en tu cuenta",
  body: "Así no los pierdes si cambias de celular. Tus registros siguen guardados también en este celular.",
  consentLabel:
    "Autorizo respaldar en mi cuenta los registros de Mi Panel (perfil, dolor, densitometrías, tomas y frascos). Se alojan en servidores de Supabase en Brasil. Puedo retirar esta autorización según la",
  accept: "Activar respaldo",
  dismiss: "Ahora no",
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export const accountBackupOfferDismissedStore = createPersistentStore<string | null>(
  "artikare_account_backup_offer_dismissed_v1",
  null,
  (raw) => (typeof raw === "string" ? raw : null)
);

export function dismissAccountBackupOffer(now: Date = new Date()): void {
  accountBackupOfferDismissedStore.write(now.toISOString());
}

export interface AccountBackupOfferInput {
  authStatus: AuthStatus;
  /** Interruptor general (features.ts): apagado hasta C5 y la revisión legal. */
  isSyncAvailable: boolean;
  consentState: AccountBackupConsentState;
  dismissedAt: string | null;
  now: Date;
}

function isSnoozed(dismissedAt: string | null, now: Date): boolean {
  const dismissedMs = dismissedAt ? Date.parse(dismissedAt) : Number.NaN;
  return !Number.isNaN(dismissedMs) && now.getTime() - dismissedMs < ACCOUNT_INVITE_SNOOZE_DAYS * DAY_MS;
}

/** Se ofrece solo a quien ya tiene cuenta, aún no lo autorizó y no lo pospuso. */
export function shouldOfferAccountBackup({
  authStatus,
  isSyncAvailable,
  consentState,
  dismissedAt,
  now,
}: AccountBackupOfferInput): boolean {
  if (!isSyncAvailable || authStatus !== "account") return false;
  if (hasCurrentAccountBackupConsent(consentState)) return false;
  return !isSnoozed(dismissedAt, now);
}

/** Guarda el consentimiento y encola su registro en la cuenta (no lleva datos de salud). */
export function grantAccountBackupConsent(now: Date = new Date()): ConsentRecord {
  const consent = createConsentRecord(now);
  accountBackupConsentStore.write({ consent });
  const queued = enqueueOutboxRequest(
    "/api/consents",
    { purpose: "respaldo-cuenta", consent },
    { containsPersonalData: false, now: now.getTime() }
  );
  if (queued) void flushOutbox();
  return consent;
}
