// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { outboxStore } from "../api/outbox";
import { ACCOUNT_INVITE_SNOOZE_DAYS } from "../auth/accountInvite";
import { findForbiddenPhrases } from "../clinical/forbiddenCopy";
import {
  ACCOUNT_BACKUP_OFFER_COPY,
  accountBackupConsentStore,
  accountBackupOfferDismissedStore,
  dismissAccountBackupOffer,
  grantAccountBackupConsent,
  hasCurrentAccountBackupConsent,
  parseAccountBackupConsent,
  shouldOfferAccountBackup,
} from "./accountBackupConsent";
import { CONSENT_VERSION } from "./consent";

const NOW = new Date("2026-10-10T15:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  // Sin red: la outbox conserva lo encolado para inspeccionarlo.
  vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);
  outboxStore.write([]);
  accountBackupConsentStore.write({ consent: null });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("consentimiento respaldo-cuenta", () => {
  it("sin consentimiento no hay respaldo", () => {
    expect(hasCurrentAccountBackupConsent(accountBackupConsentStore.getSnapshot())).toBe(false);
  });

  it("darlo lo guarda en el celular con la versión vigente de la política", () => {
    grantAccountBackupConsent();

    expect(accountBackupConsentStore.getSnapshot()).toEqual({
      consent: { consentAt: NOW.toISOString(), consentVersion: CONSENT_VERSION },
    });
    expect(hasCurrentAccountBackupConsent(accountBackupConsentStore.getSnapshot())).toBe(true);
  });

  it("darlo encola su registro en la cuenta, sin datos de salud", () => {
    grantAccountBackupConsent();

    expect(outboxStore.getSnapshot()).toEqual([
      expect.objectContaining({
        endpoint: "/api/consents",
        containsPersonalData: false,
        body: {
          purpose: "respaldo-cuenta",
          consent: { consentAt: NOW.toISOString(), consentVersion: CONSENT_VERSION },
        },
      }),
    ]);
  });

  it("un consentimiento de una versión anterior de la política no vale", () => {
    const state = { consent: { consentAt: NOW.toISOString(), consentVersion: "2025-01-01" } };

    expect(hasCurrentAccountBackupConsent(state)).toBe(false);
  });

  it("un valor corrupto en el celular se lee como sin consentimiento", () => {
    expect(parseAccountBackupConsent({ consent: { consentAt: "ayer" } })).toBeNull();
    expect(parseAccountBackupConsent("sí")).toBeNull();
  });
});

describe("shouldOfferAccountBackup", () => {
  const offerInput = {
    authStatus: "account" as const,
    isSyncAvailable: true,
    consentState: { consent: null },
    dismissedAt: null,
    now: NOW,
  };

  it("se ofrece a quien ya tiene cuenta y aún no autorizó el respaldo", () => {
    expect(shouldOfferAccountBackup(offerInput)).toBe(true);
  });

  it("no se ofrece mientras el respaldo esté apagado (features.ts)", () => {
    expect(shouldOfferAccountBackup({ ...offerInput, isSyncAvailable: false })).toBe(false);
  });

  it.each(["guest", "anonymous", "loading", "unconfigured"] as const)("no se ofrece sin cuenta (%s)", (authStatus) => {
    expect(shouldOfferAccountBackup({ ...offerInput, authStatus })).toBe(false);
  });

  it("no se ofrece si ya está autorizado con la política vigente", () => {
    const consentState = { consent: { consentAt: NOW.toISOString(), consentVersion: CONSENT_VERSION } };

    expect(shouldOfferAccountBackup({ ...offerInput, consentState })).toBe(false);
  });

  it("'Ahora no' lo oculta durante la espera y luego vuelve", () => {
    dismissAccountBackupOffer(NOW);
    const dismissedAt = accountBackupOfferDismissedStore.getSnapshot();
    const later = new Date(NOW.getTime() + ACCOUNT_INVITE_SNOOZE_DAYS * 24 * 60 * 60 * 1000);

    expect(shouldOfferAccountBackup({ ...offerInput, dismissedAt })).toBe(false);
    expect(shouldOfferAccountBackup({ ...offerInput, dismissedAt, now: later })).toBe(true);
  });

  it("el texto del consentimiento dice qué se respalda, dónde se aloja y que se puede retirar", () => {
    expect(ACCOUNT_BACKUP_OFFER_COPY.consentLabel).toMatch(/densitometr/i);
    expect(ACCOUNT_BACKUP_OFFER_COPY.consentLabel).toMatch(/Brasil/);
    expect(ACCOUNT_BACKUP_OFFER_COPY.consentLabel).toMatch(/retirar/i);
    expect(findForbiddenPhrases(Object.values(ACCOUNT_BACKUP_OFFER_COPY).join(" "))).toEqual([]);
  });
});
