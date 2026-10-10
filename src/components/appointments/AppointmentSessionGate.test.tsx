// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { flushOutbox } from "@/lib/api/outbox";
import { ensureSession } from "@/lib/supabase/browserAuth";
import { AppointmentSessionGate } from "./AppointmentSessionGate";

vi.mock("@/hooks/useAuthStatus", () => ({ useAuthStatus: vi.fn(() => "guest") }));
vi.mock("@/lib/supabase/browserAuth", () => ({ ensureSession: vi.fn() }));
vi.mock("@/lib/api/outbox", () => ({ flushOutbox: vi.fn(async () => {}) }));
vi.mock("@/components/auth/TurnstileWidget", () => ({
  TurnstileWidget: ({ onToken }: { onToken: (token: string | null) => void }) => (
    <button type="button" onClick={() => onToken("token-captcha")}>
      Verificación
    </button>
  ),
}));

beforeEach(() => {
  vi.mocked(useAuthStatus).mockReturnValue("guest");
  vi.mocked(ensureSession).mockReset();
  vi.mocked(ensureSession).mockResolvedValue({ ok: true, userId: "00000000-0000-4000-8000-00000000a11c" });
  vi.mocked(flushOutbox).mockClear();
});

describe("AppointmentSessionGate", () => {
  it("sin captcha requerido crea la sesión anónima y envía la cita pendiente", async () => {
    render(<AppointmentSessionGate captchaSiteKey={null} isCaptchaRequired={false} />);

    await waitFor(() => expect(flushOutbox).toHaveBeenCalledWith({ ignoreBackoff: true }));
    expect(ensureSession).toHaveBeenCalledWith(undefined);
  });

  it("con captcha espera la verificación y la usa al crear la sesión", async () => {
    render(<AppointmentSessionGate captchaSiteKey="site-key" isCaptchaRequired />);
    expect(ensureSession).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Verificación" }));

    await waitFor(() => expect(ensureSession).toHaveBeenCalledWith("token-captcha"));
    expect(flushOutbox).toHaveBeenCalledWith({ ignoreBackoff: true });
  });

  it("si no se pudo crear la sesión, avisa que la cita sigue guardada en el celular", async () => {
    vi.mocked(ensureSession).mockResolvedValue({ ok: false, reason: "captcha-failed" });
    render(<AppointmentSessionGate captchaSiteKey="site-key" isCaptchaRequired />);

    fireEvent.click(screen.getByRole("button", { name: "Verificación" }));

    expect(await screen.findByRole("status")).toHaveTextContent("sigue guardada en este celular");
    expect(flushOutbox).not.toHaveBeenCalled();
  });

  it.each(["anonymous", "account", "unconfigured", "loading"] as const)(
    "con estado %s no muestra nada ni crea sesiones",
    (status) => {
      vi.mocked(useAuthStatus).mockReturnValue(status);

      const { container } = render(<AppointmentSessionGate captchaSiteKey={null} isCaptchaRequired={false} />);

      expect(container).toBeEmptyDOMElement();
      expect(ensureSession).not.toHaveBeenCalled();
    }
  );

  it("captcha requerido sin site key: se cierra (la cita queda en el celular)", () => {
    const { container } = render(<AppointmentSessionGate captchaSiteKey={null} isCaptchaRequired />);

    expect(container).toBeEmptyDOMElement();
    expect(ensureSession).not.toHaveBeenCalled();
  });
});
