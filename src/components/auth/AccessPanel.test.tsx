// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OtpChannel } from "@/lib/auth/otpChannel";
import { AccessPanel } from "./AccessPanel";

function createChannel(overrides: Partial<OtpChannel> = {}): OtpChannel {
  return {
    sendCode: vi.fn(async () => ({ ok: true as const })),
    verifyCode: vi.fn(async () => ({ ok: true as const })),
    ...overrides,
  };
}

async function submitEmail(email: string) {
  fireEvent.change(screen.getByLabelText("Tu correo electrónico"), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "Enviarme el código" }));
  return screen.findByLabelText("Código de 6 dígitos");
}

describe("AccessPanel", () => {
  it("sends the code, verifies it and confirms the account", async () => {
    const channel = createChannel();
    const onSuccess = vi.fn();
    render(<AccessPanel channel={channel} onSuccess={onSuccess} />);

    const codeInput = await submitEmail("paciente@correo.pe");
    expect(channel.sendCode).toHaveBeenCalledWith("paciente@correo.pe", undefined);
    // El paso nuevo se anuncia llevando el foco al campo del código.
    expect(codeInput).toHaveFocus();
    expect(screen.getByText(/paciente@correo\.pe/)).toBeInTheDocument();
    expect(codeInput).toHaveAttribute("autocomplete", "one-time-code");
    expect(codeInput).toHaveAttribute("inputmode", "numeric");

    fireEvent.change(codeInput, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("¡Listo!");
    // Mientras no exista el respaldo en servidor (C3) no se promete que los datos viajan.
    expect(status).toHaveTextContent("siguen guardados en este celular");
    expect(status).toHaveFocus();
    expect(channel.verifyCode).toHaveBeenCalledWith("paciente@correo.pe", "123456");
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("explains a wrong code in plain Spanish and keeps the patient on the code step", async () => {
    const channel = createChannel({
      verifyCode: vi.fn(async () => ({ ok: false as const, reason: "invalid-code" as const })),
    });
    render(<AccessPanel channel={channel} />);

    const codeInput = await submitEmail("paciente@correo.pe");
    fireEvent.change(codeInput, { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("El código no es correcto o ya venció");
    const field = screen.getByLabelText("Código de 6 dígitos");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field.getAttribute("aria-describedby")).toContain(alert.id);
  });

  it("lets the patient go back and change the email", async () => {
    render(<AccessPanel channel={createChannel()} />);
    await submitEmail("paciente@correo.pe");

    fireEvent.click(screen.getByRole("button", { name: "Cambiar correo" }));
    expect(screen.getByLabelText("Tu correo electrónico")).toHaveValue("paciente@correo.pe");
  });

  it("fails closed when a captcha is required but no site key is configured", () => {
    render(<AccessPanel channel={createChannel()} captchaSiteKey={null} isCaptchaRequired />);
    expect(screen.getByText(/Tus registros siguen guardados en este celular/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Tu correo electrónico")).not.toBeInTheDocument();
  });

  it("explains why sending is disabled while the security check is pending", () => {
    render(<AccessPanel channel={createChannel()} captchaSiteKey="site-key" isCaptchaRequired />);
    fireEvent.change(screen.getByLabelText("Tu correo electrónico"), { target: { value: "a@b.pe" } });
    const button = screen.getByRole("button", { name: "Enviarme el código" });
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleDescription(/verificación de seguridad/i);
  });

  it("tells the guest their records stay on this phone when accounts are not available", () => {
    render(<AccessPanel channel={null} />);
    expect(screen.getByText(/Tus registros siguen guardados en este celular/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Tu correo electrónico")).not.toBeInTheDocument();
  });
});
