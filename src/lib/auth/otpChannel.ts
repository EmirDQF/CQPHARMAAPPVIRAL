import type { AuthErrorLike, AuthFailureReason, AuthOutcome } from "./types";

/**
 * Canal de código de un solo uso. Hoy solo existe EmailOtpChannel; SMS o WhatsApp
 * serán otra implementación de esta interfaz, sin tocar las pantallas.
 */
export interface OtpChannel {
  sendCode(destination: string, captchaToken?: string): Promise<AuthOutcome>;
  verifyCode(destination: string, code: string): Promise<AuthOutcome>;
}

export const OTP_CODE_LENGTH = 6;

const RATE_LIMIT_CODES = new Set(["over_email_send_rate_limit", "over_request_rate_limit"]);
const INVALID_DESTINATION_CODES = new Set(["email_address_invalid", "validation_failed"]);
const HTTP_TOO_MANY_REQUESTS = 429;

/** Traduce el error de Supabase Auth a un motivo estable, sin exponer su mensaje. */
export function toAuthFailureReason(error: AuthErrorLike): AuthFailureReason {
  if (error.code && RATE_LIMIT_CODES.has(error.code)) return "rate-limited";
  if (error.status === HTTP_TOO_MANY_REQUESTS) return "rate-limited";
  if (error.code === "captcha_failed") return "captcha-failed";
  if (error.code === "otp_expired") return "invalid-code";
  if (error.code && INVALID_DESTINATION_CODES.has(error.code)) return "invalid-destination";
  return "unavailable";
}
