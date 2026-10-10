// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { isAccountSyncAvailable } from "@/lib/auth/features";
import { accountBackupConsentStore } from "@/lib/privacy/accountBackupConsent";
import { CONSENT_VERSION } from "@/lib/privacy/consent";
import { runBrowserAccountSync } from "@/lib/supabase/browserSync";
import { SyncCoordinator } from "./SyncCoordinator";

vi.mock("@/lib/supabase/browserSync", () => ({ runBrowserAccountSync: vi.fn(async () => null) }));
vi.mock("@/lib/auth/features", () => ({ isAccountSyncAvailable: vi.fn(() => true) }));
vi.mock("@/hooks/useAuthStatus", () => ({ useAuthStatus: vi.fn(() => "account") }));

const consent = { consentAt: "2026-10-10T12:00:00.000Z", consentVersion: CONSENT_VERSION };

beforeEach(() => {
  vi.mocked(runBrowserAccountSync).mockClear();
  vi.mocked(isAccountSyncAvailable).mockReturnValue(true);
  vi.mocked(useAuthStatus).mockReturnValue("account");
  accountBackupConsentStore.write({ consent });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SyncCoordinator", () => {
  it("hace un pase al abrir la app con cuenta y consentimiento", () => {
    render(<SyncCoordinator />);

    expect(runBrowserAccountSync).toHaveBeenCalledTimes(1);
    expect(runBrowserAccountSync).toHaveBeenCalledWith(consent);
  });

  it("vuelve a respaldar al recuperar la conexión y al volver a la pestaña", () => {
    render(<SyncCoordinator />);

    act(() => {
      window.dispatchEvent(new Event("online"));
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(runBrowserAccountSync).toHaveBeenCalledTimes(3);
  });

  it("no hace nada mientras el respaldo esté apagado (features.ts)", () => {
    vi.mocked(isAccountSyncAvailable).mockReturnValue(false);

    render(<SyncCoordinator />);

    expect(runBrowserAccountSync).not.toHaveBeenCalled();
  });

  it.each(["guest", "anonymous", "loading", "unconfigured"] as const)("no respalda sin cuenta (%s)", (status) => {
    vi.mocked(useAuthStatus).mockReturnValue(status);

    render(<SyncCoordinator />);

    expect(runBrowserAccountSync).not.toHaveBeenCalled();
  });

  it("no respalda sin el consentimiento respaldo-cuenta vigente", () => {
    accountBackupConsentStore.write({ consent: null });

    render(<SyncCoordinator />);

    expect(runBrowserAccountSync).not.toHaveBeenCalled();
  });

  it("deja de escuchar al desmontarse", () => {
    const { unmount } = render(<SyncCoordinator />);
    unmount();

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(runBrowserAccountSync).toHaveBeenCalledTimes(1);
  });
});
