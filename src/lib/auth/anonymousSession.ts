import { toAuthFailureReason } from "./otpChannel";
import type { AuthClientLike, AuthFailureReason } from "./types";

export type EnsureSessionResult =
  | { ok: true; userId: string }
  | { ok: false; reason: AuthFailureReason };

/**
 * Invitado primero: la app funciona sin sesión y la sesión anónima se crea solo
 * cuando hay algo que enviar al servidor (evaluación o cita). Llamadas simultáneas
 * comparten el mismo intento, así no se crean dos usuarios anónimos.
 */
export function createSessionEnsurer(auth: AuthClientLike) {
  let inFlight: Promise<EnsureSessionResult> | null = null;

  async function ensure(captchaToken?: string): Promise<EnsureSessionResult> {
    const { data } = await auth.getSession();
    if (data.session) return { ok: true, userId: data.session.user.id };

    const { error } = await auth.signInAnonymously({ options: { captchaToken } });
    if (error) return { ok: false, reason: toAuthFailureReason(error) };

    const { data: created } = await auth.getSession();
    if (!created.session) return { ok: false, reason: "unavailable" };
    return { ok: true, userId: created.session.user.id };
  }

  return function ensureSession(captchaToken?: string): Promise<EnsureSessionResult> {
    inFlight ??= ensure(captchaToken).finally(() => {
      inFlight = null;
    });
    return inFlight;
  };
}
