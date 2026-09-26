import { createPersistentStore } from "@/lib/storage/persistentStore";
import type { AuthStatus } from "./types";

/** Momentos del plan en que se invita a crear cuenta. */
export type AccountInviteMoment = "racha" | "reporte" | "cita";

export const ACCOUNT_INVITE_STREAK_DAYS = 3;
/** Tras "Ahora no", la invitación no vuelve a aparecer en ningún momento durante estos días. */
export const ACCOUNT_INVITE_SNOOZE_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Copy aprobado: beneficio concreto, sin miedo ni culpa, y siempre con salida. */
export const ACCOUNT_INVITE_COPY = {
  title: "No pierdas tus registros si cambias de celular",
  body: "Crea tu cuenta con tu correo y un código de 6 dígitos. Sin contraseñas.",
  accept: "Crear mi cuenta",
  dismiss: "Ahora no",
  signIn: "¿Ya tienes cuenta? Ingresa",
} as const;

export interface AccountInviteInput {
  moment: AccountInviteMoment;
  authStatus: AuthStatus;
  streakDays: number;
  dismissedAt: string | null;
  /** Sin respaldo en servidor la promesa del título sería falsa (ver features.ts). */
  isSyncAvailable: boolean;
  now: Date;
}

function isSnoozed(dismissedAt: string | null, now: Date): boolean {
  if (!dismissedAt) return false;
  const dismissedMs = Date.parse(dismissedAt);
  if (Number.isNaN(dismissedMs)) return false;
  return now.getTime() - dismissedMs < ACCOUNT_INVITE_SNOOZE_DAYS * DAY_MS;
}

export function shouldShowAccountInvite({
  moment,
  authStatus,
  streakDays,
  dismissedAt,
  isSyncAvailable,
  now,
}: AccountInviteInput): boolean {
  if (!isSyncAvailable) return false;
  // Sin Supabase configurado la app es solo invitado: no se ofrece algo que no funciona.
  if (authStatus !== "guest" && authStatus !== "anonymous") return false;
  if (moment === "racha" && streakDays < ACCOUNT_INVITE_STREAK_DAYS) return false;
  return !isSnoozed(dismissedAt, now);
}

function parseDismissedAt(raw: unknown): string | null {
  return typeof raw === "string" ? raw : null;
}

export const accountInviteDismissedStore = createPersistentStore<string | null>(
  "artikare_account_invite_dismissed_v1",
  null,
  parseDismissedAt
);

export function dismissAccountInvite(now: Date = new Date()): void {
  accountInviteDismissedStore.write(now.toISOString());
}
