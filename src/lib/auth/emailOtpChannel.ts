import { z } from "zod";
import { OTP_CODE_LENGTH, toAuthFailureReason, type OtpChannel } from "./otpChannel";
import type { AuthClientLike, AuthOutcome, OtpVerificationType } from "./types";

const EmailSchema = z.email();
const OTP_CODE_PATTERN = new RegExp(`^\\d{${OTP_CODE_LENGTH}}$`);

function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  return EmailSchema.safeParse(email).success ? email : null;
}

/**
 * OTP de 6 dígitos por correo (Supabase Auth + SMTP de Resend, plantilla con
 * {{ .Token }}). Sin contraseñas ni magic links: rompen la sesión de la PWA.
 *
 * Invitado anónimo → se le agrega el correo (`email_change`) y conserva su
 * auth.uid(), así sus datos no se mueven. Sin sesión, o si el correo ya tiene
 * cuenta → inicio de sesión normal (`email`).
 */
export function createEmailOtpChannel(auth: AuthClientLike): OtpChannel {
  const verificationTypeByEmail = new Map<string, OtpVerificationType>();

  async function signInWithCode(email: string, captchaToken?: string): Promise<AuthOutcome> {
    const { error } = await auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, captchaToken },
    });
    if (error) return { ok: false, reason: toAuthFailureReason(error) };
    verificationTypeByEmail.set(email, "email");
    return { ok: true };
  }

  return {
    async sendCode(destination, captchaToken) {
      const email = normalizeEmail(destination);
      if (!email) return { ok: false, reason: "invalid-destination" };

      const { data } = await auth.getSession();
      if (!data.session?.user.is_anonymous) return signInWithCode(email, captchaToken);

      const { error } = await auth.updateUser({ email });
      if (error?.code === "email_exists") return signInWithCode(email, captchaToken);
      if (error) return { ok: false, reason: toAuthFailureReason(error) };
      verificationTypeByEmail.set(email, "email_change");
      return { ok: true };
    },

    async verifyCode(destination, code) {
      const email = normalizeEmail(destination);
      if (!email) return { ok: false, reason: "invalid-destination" };
      const token = code.replace(/\s/g, "");
      if (!OTP_CODE_PATTERN.test(token)) return { ok: false, reason: "invalid-code" };

      const type = verificationTypeByEmail.get(email) ?? "email";
      const { error } = await auth.verifyOtp({ email, token, type });
      if (error) return { ok: false, reason: toAuthFailureReason(error) };
      verificationTypeByEmail.delete(email);
      return { ok: true };
    },
  };
}
