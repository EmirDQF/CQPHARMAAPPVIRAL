/**
 * Contrato mínimo de Supabase Auth que usa la app. Se declara aquí (sin importar
 * el SDK) para que la lógica de auth se pruebe con un fake y los componentes nunca
 * dependan de Supabase. `src/lib/supabase/client.ts` entrega el cliente real.
 */
export interface AuthErrorLike {
  code?: string;
  status?: number;
  message: string;
}

export interface AuthSessionLike {
  user: { id: string; is_anonymous?: boolean; email?: string };
}

type AuthResult = Promise<{ error: AuthErrorLike | null }>;

export type OtpVerificationType = "email" | "email_change";

export interface AuthClientLike {
  getSession(): Promise<{ data: { session: AuthSessionLike | null }; error: AuthErrorLike | null }>;
  signInAnonymously(credentials?: { options?: { captchaToken?: string } }): AuthResult;
  signInWithOtp(credentials: {
    email: string;
    options?: { shouldCreateUser?: boolean; captchaToken?: string };
  }): AuthResult;
  updateUser(attributes: { email: string }): AuthResult;
  verifyOtp(params: { email: string; token: string; type: OtpVerificationType }): AuthResult;
}

/** Motivos de fallo que la UI traduce a mensajes en es-PE. Nunca llevan el correo. */
export type AuthFailureReason =
  | "invalid-destination"
  | "invalid-code"
  | "rate-limited"
  | "captcha-failed"
  | "unavailable";

export type AuthOutcome = { ok: true } | { ok: false; reason: AuthFailureReason };

/** Estado de sesión visible para la UI. */
export type AuthStatus = "unconfigured" | "loading" | "guest" | "anonymous" | "account";
