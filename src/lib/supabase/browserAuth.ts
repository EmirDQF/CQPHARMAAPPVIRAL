import { createSessionEnsurer, type EnsureSessionResult } from "@/lib/auth/anonymousSession";
import { createEmailOtpChannel } from "@/lib/auth/emailOtpChannel";
import type { OtpChannel } from "@/lib/auth/otpChannel";
import type { AuthStatus } from "@/lib/auth/types";
import { createListenerSet } from "@/lib/createListenerSet";
import { readPublicSupabaseEnv } from "@/lib/env";
import { getBrowserSupabase } from "./client";

// ─── Estado de sesión para useSyncExternalStore ─────────────────────────────
const { subscribe: addListener, notify } = createListenerSet();
let status: AuthStatus | null = null;
let isListeningToAuth = false;

function initialStatus(): AuthStatus {
  return readPublicSupabaseEnv() ? "loading" : "unconfigured";
}

function startListening(): void {
  if (isListeningToAuth) return;
  const supabase = getBrowserSupabase();
  if (!supabase) return;
  isListeningToAuth = true;
  // INITIAL_SESSION llega al suscribirse, así "loading" dura solo hasta leer la sesión guardada.
  supabase.auth.onAuthStateChange((_event, session) => {
    const next: AuthStatus = !session ? "guest" : session.user.is_anonymous ? "anonymous" : "account";
    if (next === status) return;
    status = next;
    notify();
  });
}

export const authStatusStore = {
  subscribe(listener: () => void): () => void {
    startListening();
    return addListener(listener);
  },
  getSnapshot(): AuthStatus {
    status ??= initialStatus();
    return status;
  },
  getServerSnapshot: initialStatus,
};

// ─── Canal OTP y sesión anónima perezosa ────────────────────────────────────
let emailChannel: OtpChannel | null = null;
let sessionEnsurer: ((captchaToken?: string) => Promise<EnsureSessionResult>) | null = null;

/** null = sin Supabase configurado (modo solo invitado). */
export function getEmailOtpChannel(): OtpChannel | null {
  const supabase = getBrowserSupabase();
  if (!supabase) return null;
  emailChannel ??= createEmailOtpChannel(supabase.auth);
  return emailChannel;
}

/** Se llama solo al enviar algo al servidor (evaluación o cita), nunca al abrir la app. */
export async function ensureSession(captchaToken?: string): Promise<EnsureSessionResult> {
  const supabase = getBrowserSupabase();
  if (!supabase) return { ok: false, reason: "unavailable" };
  sessionEnsurer ??= createSessionEnsurer(supabase.auth);
  return sessionEnsurer(captchaToken);
}
