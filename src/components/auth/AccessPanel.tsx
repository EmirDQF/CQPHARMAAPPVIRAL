"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { isAccountSyncAvailable } from "@/lib/auth/features";
import { AUTH_FAILURE_MESSAGES } from "@/lib/auth/messages";
import { OTP_CODE_LENGTH, type OtpChannel } from "@/lib/auth/otpChannel";
import type { AuthOutcome } from "@/lib/auth/types";
import { isCaptchaRequired as isCaptchaRequiredInEnv, readTurnstileSiteKey } from "@/lib/env";
import { TurnstileWidget } from "./TurnstileWidget";

type Step = "email" | "code" | "done";

interface AccessPanelProps {
  /** null = Supabase no configurado: la app sigue solo en modo invitado. */
  channel: OtpChannel | null;
  onSuccess?: () => void;
  /** Por defecto se leen del entorno; los tests los fijan. */
  captchaSiteKey?: string | null;
  isCaptchaRequired?: boolean;
}

const UNAVAILABLE_MESSAGE =
  "El acceso con cuenta aún no está disponible. Tus registros siguen guardados en este celular.";

const primaryButtonClassName =
  "min-h-12 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-lg transition-colors";
// Bordes con contraste ≥ 3:1 (WCAG 1.4.11) en claro y oscuro.
const inputClassName =
  "min-h-12 w-full rounded-xl border-2 border-neutral-500 dark:border-neutral-400 bg-background px-4 text-lg focus:border-brand focus:outline-none";
const secondaryButtonClassName =
  "min-h-12 rounded-xl border-2 border-neutral-500 dark:border-neutral-400 font-semibold";

/** Acceso con correo + código de 6 dígitos (sin contraseñas ni enlaces mágicos). */
export function AccessPanel({
  channel,
  onSuccess,
  captchaSiteKey = readTurnstileSiteKey(),
  isCaptchaRequired = isCaptchaRequiredInEnv(),
}: AccessPanelProps) {
  const emailId = useId();
  const codeId = useId();
  const errorId = useId();
  const captchaHintId = useId();

  const emailInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const previousStepRef = useRef<Step>("email");
  const isMountedRef = useRef(true);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // Cada token de Turnstile sirve una sola vez: al volver al correo se monta un widget nuevo.
  const [captchaRound, setCaptchaRound] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Al cambiar de paso el foco va al contenido nuevo, así el lector de pantalla lo anuncia.
  useEffect(() => {
    if (previousStepRef.current === step) return;
    previousStepRef.current = step;
    if (step === "code") codeInputRef.current?.focus();
    if (step === "done") statusRef.current?.focus();
    if (step === "email") emailInputRef.current?.focus();
  }, [step]);

  // Fail-closed: sin captcha configurado donde es obligatorio no se envían códigos.
  if (!channel || (isCaptchaRequired && !captchaSiteKey)) {
    return <p className="text-neutral-600 dark:text-neutral-300">{UNAVAILABLE_MESSAGE}</p>;
  }

  async function run(action: () => Promise<AuthOutcome>, onOk: () => void) {
    setIsPending(true);
    setErrorMessage(null);
    const outcome = await action();
    // El diálogo pudo cerrarse mientras esperábamos a Supabase.
    if (!isMountedRef.current) return;
    setIsPending(false);
    if (outcome.ok) {
      onOk();
      return;
    }
    setErrorMessage(AUTH_FAILURE_MESSAGES[outcome.reason]);
  }

  function handleSendCode(event: FormEvent) {
    event.preventDefault();
    if (!channel) return;
    void run(
      () => channel.sendCode(email, captchaToken ?? undefined),
      () => {
        setCaptchaToken(null);
        setStep("code");
      }
    );
  }

  function handleVerify(event: FormEvent) {
    event.preventDefault();
    if (!channel) return;
    void run(
      () => channel.verifyCode(email, code),
      () => {
        setStep("done");
        onSuccess?.();
      }
    );
  }

  function backToEmail() {
    setStep("email");
    setCode("");
    setErrorMessage(null);
    setCaptchaToken(null);
    setCaptchaRound((round) => round + 1);
  }

  const isCaptchaMissing = captchaSiteKey !== null && captchaToken === null;
  const hasError = errorMessage !== null;
  const errorMessageNode = hasError && (
    <p id={errorId} role="alert" className="rounded-xl bg-risk-high-bg text-risk-high px-4 py-3 font-medium">
      {errorMessage}
    </p>
  );

  return (
    <div className="flex flex-col gap-4">
      {step === "email" && (
        <form onSubmit={handleSendCode} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <label htmlFor={emailId} className="font-medium">
              Tu correo electrónico
            </label>
            <input
              ref={emailInputRef}
              id={emailId}
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={hasError}
              aria-describedby={hasError ? errorId : undefined}
              className={inputClassName}
            />
            {errorMessageNode}
          </div>
          {captchaSiteKey && (
            <>
              <TurnstileWidget key={captchaRound} siteKey={captchaSiteKey} onToken={setCaptchaToken} />
              {isCaptchaMissing && (
                <p id={captchaHintId} className="text-sm text-neutral-600 dark:text-neutral-300">
                  Esperando la verificación de seguridad. Si no avanza en unos segundos, recarga la página.
                </p>
              )}
            </>
          )}
          <button
            type="submit"
            disabled={isPending || email.trim() === "" || isCaptchaMissing}
            aria-describedby={isCaptchaMissing ? captchaHintId : undefined}
            className={primaryButtonClassName}
          >
            {isPending ? "Enviando…" : "Enviarme el código"}
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={handleVerify} className="flex flex-col gap-4" noValidate>
          <p>
            Te enviamos un código de {OTP_CODE_LENGTH} dígitos a <strong>{email.trim()}</strong>. Vence en
            10 minutos. Si no te llegó, revisa tu carpeta de spam.
          </p>
          <div className="flex flex-col gap-2">
            <label htmlFor={codeId} className="font-medium">
              Código de {OTP_CODE_LENGTH} dígitos
            </label>
            <input
              ref={codeInputRef}
              id={codeId}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]*"
              maxLength={OTP_CODE_LENGTH + 1}
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
              aria-invalid={hasError}
              aria-describedby={hasError ? errorId : undefined}
              className={`${inputClassName} tracking-[0.4em] text-center font-bold`}
            />
            {errorMessageNode}
          </div>
          <button type="submit" disabled={isPending || code.trim() === ""} className={primaryButtonClassName}>
            {isPending ? "Verificando…" : "Verificar"}
          </button>
          <button type="button" onClick={backToEmail} className={secondaryButtonClassName}>
            Cambiar correo
          </button>
        </form>
      )}

      {step === "done" && (
        <p
          ref={statusRef}
          role="status"
          tabIndex={-1}
          className="rounded-xl bg-risk-low-bg text-risk-low px-4 py-3 font-semibold"
        >
          ¡Listo! Tu cuenta está activa con {email.trim()}.
          {!isAccountSyncAvailable() && " Por ahora tus registros siguen guardados en este celular."}
        </p>
      )}
    </div>
  );
}
