// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { outboxStore } from "@/lib/api/outbox";
import { isAccountSyncAvailable } from "@/lib/auth/features";
import { findForbiddenPhrases } from "@/lib/clinical/forbiddenCopy";
import {
  accountBackupConsentStore,
  accountBackupOfferDismissedStore,
} from "@/lib/privacy/accountBackupConsent";
import { AccountBackupOffer } from "./AccountBackupOffer";

vi.mock("@/lib/auth/features", () => ({ isAccountSyncAvailable: vi.fn(() => true) }));
vi.mock("@/hooks/useAuthStatus", () => ({ useAuthStatus: vi.fn(() => "account") }));

beforeEach(() => {
  vi.mocked(isAccountSyncAvailable).mockReturnValue(true);
  vi.mocked(useAuthStatus).mockReturnValue("account");
  // Sin red: la outbox conserva lo encolado para inspeccionarlo.
  vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);
  accountBackupConsentStore.write({ consent: null });
  accountBackupOfferDismissedStore.write(null);
  outboxStore.write([]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function activateButton() {
  return screen.getByRole("button", { name: "Activar respaldo" });
}

describe("AccountBackupOffer", () => {
  it("no aparece mientras el respaldo esté apagado (features.ts)", () => {
    vi.mocked(isAccountSyncAvailable).mockReturnValue(false);

    const { container } = render(<AccountBackupOffer />);

    expect(container).toBeEmptyDOMElement();
  });

  it("no aparece sin cuenta", () => {
    vi.mocked(useAuthStatus).mockReturnValue("guest");

    const { container } = render(<AccountBackupOffer />);

    expect(container).toBeEmptyDOMElement();
  });

  it("la casilla empieza sin marcar y el botón no activa nada hasta marcarla", () => {
    render(<AccountBackupOffer />);

    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(activateButton()).toBeDisabled();
  });

  it("al autorizar guarda el consentimiento, lo encola y lo confirma", () => {
    render(<AccountBackupOffer />);

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(activateButton());

    expect(accountBackupConsentStore.getSnapshot().consent).not.toBeNull();
    expect(outboxStore.getSnapshot()).toEqual([expect.objectContaining({ endpoint: "/api/consents" })]);
    expect(screen.getByRole("status")).toHaveTextContent("Respaldo activado");
    expect(screen.getByRole("status")).toHaveFocus();
  });

  it("'Ahora no' la oculta y lo recuerda", () => {
    const { container } = render(<AccountBackupOffer />);

    fireEvent.click(screen.getByRole("button", { name: "Ahora no" }));

    expect(container).toBeEmptyDOMElement();
    expect(accountBackupOfferDismissedStore.getSnapshot()).not.toBeNull();
    expect(accountBackupConsentStore.getSnapshot().consent).toBeNull();
  });

  it("enlaza la Política de Privacidad y usa copy permitido", () => {
    const { container } = render(<AccountBackupOffer />);

    expect(screen.getByRole("link", { name: "Política de Privacidad" })).toHaveAttribute("href", "/privacidad");
    expect(findForbiddenPhrases(container.textContent ?? "")).toEqual([]);
  });
});
