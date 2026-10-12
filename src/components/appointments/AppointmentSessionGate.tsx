"use client";

import { useCallback, useEffect, useState } from "react";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { flushOutbox } from "@/lib/api/outbox";
import { isCaptchaRequired as isCaptchaRequiredInEnv, readTurnstileSiteKey } from "@/lib/env";
import { ensureSession } from "@/lib/supabase/browserAuth";

interface AppointmentSessionGateProps {
  /** Por defecto se leen del entorno; los tests los fijan. */
  captchaSiteKey?: string | null;
  isCaptchaRequired?: boolean;
}

const SESSION_FAILED_MESSAGE =
  "Tu cita sigue guardada en este celular y tu código es válido. La enviaremos al consultorio cuando sea posible.";

/** Crea la sesión anónima y envía ya lo pendiente (la cita esperaba con 401). */
async function openSessionAndFlush(captchaToken?: string): Promise<boolean> {
  const result = await ensureSession(captchaToken);
  if (result.ok) void flushOutbox({ ignoreBackoff: true });
  return result.ok;
}

/**
 * Tras agendar (C4): la cita ya está en el celular y en la outbox. Para que
 * llegue a la base hace falta una sesión anónima, que se crea aquí con el
 * captcha (Turnstile) y luego se envía lo pendiente. Invitado primero: si no
 * se puede, la cita y el WhatsApp siguen funcionando igual.
 */
export function AppointmentSessionGate({
  captchaSiteKey = readTurnstileSiteKey(),
  isCaptchaRequired = isCaptchaRequiredInEnv(),
}: AppointmentSessionGateProps) {
  const authStatus = useAuthStatus();
  const [hasFailed, setHasFailed] = useState(false);
  const usesCaptcha = isCaptchaRequired || captchaSiteKey !== null;
  const isGuest = authStatus === "guest";

  const handleToken = useCallback((token: string | null) => {
    if (!token) return;
    void openSessionAndFlush(token).then((isOpen) => {
      if (!isOpen) setHasFailed(true);
    });
  }, []);

  useEffect(() => {
    if (!isGuest || usesCaptcha) return;
    let isCancelled = false;
    void openSessionAndFlush(undefined).then((isOpen) => {
      if (!isOpen && !isCancelled) setHasFailed(true);
    });
    return () => {
      isCancelled = true;
    };
  }, [isGuest, usesCaptcha]);

  // Fail-closed: con captcha obligatorio y sin site key no se crean sesiones.
  if (!isGuest || (isCaptchaRequired && !captchaSiteKey)) return null;

  return (
    <section aria-label="Registro de tu cita en el consultorio" className="flex flex-col gap-2 print:hidden">
      {usesCaptcha && captchaSiteKey && (
        <>
          <p className="text-lg text-muted">
            Para registrar tu cita en el consultorio, completa esta verificación rápida.
          </p>
          <TurnstileWidget siteKey={captchaSiteKey} onToken={handleToken} />
        </>
      )}
      {hasFailed && (
        <p role="status" className="text-lg text-muted">
          {SESSION_FAILED_MESSAGE}
        </p>
      )}
    </section>
  );
}
