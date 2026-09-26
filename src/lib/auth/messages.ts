import type { AuthFailureReason } from "./types";

/** Mensajes en es-PE: dicen qué pasó y qué hacer, sin tecnicismos. */
export const AUTH_FAILURE_MESSAGES: Record<AuthFailureReason, string> = {
  "invalid-destination": "Revisa tu correo: parece que falta algo (ejemplo: nombre@correo.com).",
  "invalid-code": "El código no es correcto o ya venció. Revísalo o pide uno nuevo.",
  "rate-limited": "Pediste varios códigos seguidos. Espera unos minutos y vuelve a intentarlo.",
  "captcha-failed": "No pudimos confirmar que no eres un robot. Vuelve a intentarlo.",
  unavailable: "No pudimos conectarnos. Revisa tu internet y vuelve a intentarlo.",
};
