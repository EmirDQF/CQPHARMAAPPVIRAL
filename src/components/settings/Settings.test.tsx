// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { outboxStore } from "@/lib/api/outbox";
import { accountBackupConsentStore } from "@/lib/privacy/accountBackupConsent";
import { CONSENT_VERSION } from "@/lib/privacy/consent";
import { AccountDeletionSection } from "./AccountDeletionSection";
import { DataExportSection } from "./DataExportSection";
import { OppositionSection } from "./OppositionSection";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.localStorage.setItem("artikare_pain_log_v1", JSON.stringify([{ date: "2026-10-01", painLevel: 3 }]));
  vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  outboxStore.write([]);
  accountBackupConsentStore.write({ consent: null });
});

describe("AccountDeletionSection", () => {
  it("no borra nada hasta marcar la confirmación explícita", () => {
    render(<AccountDeletionSection authStatus="guest" onDeleted={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Borrar mi cuenta y mis datos" }));

    expect(screen.getByRole("dialog", { name: "¿Borrar todos tus datos?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Borrar definitivamente" })).toBeDisabled();
    expect(window.localStorage.getItem("artikare_pain_log_v1")).not.toBeNull();
  });

  it("como invitado borra todo lo de este celular y deja la marca de confirmación", async () => {
    const onDeleted = vi.fn();
    const fetcher = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetcher);
    render(<AccountDeletionSection authStatus="guest" onDeleted={onDeleted} />);

    fireEvent.click(screen.getByRole("button", { name: "Borrar mi cuenta y mis datos" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Entiendo que el borrado es definitivo." }));
    fireEvent.click(screen.getByRole("button", { name: "Borrar definitivamente" }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(window.localStorage.getItem("artikare_pain_log_v1")).toBeNull();
    expect(window.sessionStorage.length).toBe(1);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("con cuenta, si el servidor falla, avisa y no toca el celular", async () => {
    const onDeleted = vi.fn();
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ success: false }, 503)));
    render(<AccountDeletionSection authStatus="account" onDeleted={onDeleted} />);

    fireEvent.click(screen.getByRole("button", { name: "Borrar mi cuenta y mis datos" }));
    expect(screen.getByText(/De tu cuenta/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Entiendo que el borrado es definitivo." }));
    fireEvent.click(screen.getByRole("button", { name: "Borrar definitivamente" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos borrar tu cuenta");
    expect(onDeleted).not.toHaveBeenCalled();
    expect(window.localStorage.getItem("artikare_pain_log_v1")).not.toBeNull();
  });

  it("con cuenta, si el servidor confirma, borra la cuenta y luego el celular", async () => {
    const onDeleted = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ success: true, data: { deleted: true } }))
    );
    render(<AccountDeletionSection authStatus="account" onDeleted={onDeleted} />);

    fireEvent.click(screen.getByRole("button", { name: "Borrar mi cuenta y mis datos" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Entiendo que el borrado es definitivo." }));
    fireEvent.click(screen.getByRole("button", { name: "Borrar definitivamente" }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(window.localStorage.getItem("artikare_pain_log_v1")).toBeNull();
  });
});

describe("OppositionSection", () => {
  it("retira el respaldo tras confirmar y lo dice", () => {
    accountBackupConsentStore.write({
      consent: { consentAt: "2026-10-10T12:00:00.000Z", consentVersion: CONSENT_VERSION },
    });
    render(<OppositionSection />);

    fireEvent.click(screen.getByRole("button", { name: "Dejar de respaldar mis registros en la cuenta" }));
    fireEvent.click(screen.getByRole("button", { name: "Sí, dejar de respaldar" }));

    expect(screen.getByRole("status")).toHaveTextContent("dejamos de respaldar");
    expect(accountBackupConsentStore.getSnapshot().consent).toBeNull();
  });

  it("sin respaldo activo explica que Mi Panel se guarda solo en el celular", () => {
    render(<OppositionSection />);

    expect(screen.getByText(/se guarda solo en este celular/)).toBeInTheDocument();
  });
});

describe("DataExportSection", () => {
  it("muestra en pantalla todo lo de este celular, sin pedir la cuenta a un invitado", async () => {
    const fetcher = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetcher);
    render(<DataExportSection authStatus="guest" />);

    fireEvent.click(screen.getByRole("button", { name: "Ver mis datos aquí" }));

    const preview = await screen.findByLabelText("Mis datos en formato JSON");
    expect(preview).toHaveTextContent("diarioDeDolorYRigidez");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("descarga el archivo y avisa si no pudo traer lo de la cuenta", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockRejectedValue(new TypeError("Failed to fetch")));
    const createObjectURL = vi.fn(() => "blob:artikare");
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<DataExportSection authStatus="account" />);

    fireEvent.click(screen.getByRole("button", { name: "Descargar mis datos (JSON)" }));

    expect(await screen.findByRole("status")).toHaveTextContent("no pudimos traer los de tu cuenta");
    expect(click).toHaveBeenCalled();
  });
});
