// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthStatus } from "@/lib/auth/types";
import { ACCOUNT_INVITE_COPY, accountInviteDismissedStore } from "@/lib/auth/accountInvite";
import { AccountInvite } from "./AccountInvite";

let mockStatus: AuthStatus = "guest";
let mockSyncAvailable = true;
vi.mock("@/hooks/useAuthStatus", () => ({ useAuthStatus: () => mockStatus }));
vi.mock("@/lib/auth/features", () => ({
  isAccountSyncAvailable: () => mockSyncAvailable,
}));
vi.mock("@/lib/supabase/browserAuth", () => ({ getEmailOtpChannel: () => null }));

beforeEach(() => {
  mockStatus = "guest";
  mockSyncAvailable = true;
});

afterEach(() => {
  accountInviteDismissedStore.write(null);
});

describe("AccountInvite", () => {
  it("invites a guest on the medical report with a way out", () => {
    render(<AccountInvite moment="reporte" />);
    expect(screen.getByRole("heading", { name: ACCOUNT_INVITE_COPY.title })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ahora no" })).toBeInTheDocument();
  });

  it("remembers 'Ahora no' and hides the invitation in every moment", () => {
    const { unmount } = render(<AccountInvite moment="reporte" />);
    fireEvent.click(screen.getByRole("button", { name: "Ahora no" }));

    expect(screen.queryByRole("heading", { name: ACCOUNT_INVITE_COPY.title })).not.toBeInTheDocument();
    expect(accountInviteDismissedStore.getSnapshot()).not.toBeNull();

    unmount();
    render(<AccountInvite moment="cita" />);
    expect(screen.queryByRole("heading", { name: ACCOUNT_INVITE_COPY.title })).not.toBeInTheDocument();
  });

  it("waits for a 3-day streak before inviting from the streak moment", () => {
    const { rerender } = render(<AccountInvite moment="racha" streakDays={2} />);
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();

    rerender(<AccountInvite moment="racha" streakDays={3} />);
    expect(screen.getByRole("heading", { name: ACCOUNT_INVITE_COPY.title })).toBeInTheDocument();
  });

  it.each(["unconfigured", "account", "loading"] as const)("renders nothing when auth is %s", (status) => {
    mockStatus = status;
    const { container } = render(<AccountInvite moment="reporte" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("stays hidden while records cannot be backed up yet", () => {
    mockSyncAvailable = false;
    const { container } = render(<AccountInvite moment="reporte" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("opens the access dialog from 'Crear mi cuenta'", () => {
    render(<AccountInvite moment="cita" />);
    fireEvent.click(screen.getByRole("button", { name: ACCOUNT_INVITE_COPY.accept }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
