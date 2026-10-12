import { z } from "zod";
import { PATIENT_AGE_MAX, PATIENT_AGE_MIN } from "../clinical/constants";
import { MENOPAUSAL_STATUSES, type MenopausalStatus } from "../clinical/tScoreEligibility";
import type { PatientProfile } from "../dashboard/patientProfile";
import { createPersistentStore } from "../storage/persistentStore";
import type { Sex } from "../types";
import { toLimaIsoDate } from "../utils/date";

/**
 * Primer arranque de /app (splash → bienvenida → consentimiento → perfil →
 * metas). Se guarda local (`artikare_onboarding_v1`, sin datos de salud) y
 * se ejecuta una sola vez. Quien ya tenía perfil no lo repite.
 */
export const ONBOARDING_VERSION = 1;
export const INTENSITIES = ["light", "normal", "pro"] as const;
export type Intensity = (typeof INTENSITIES)[number];

/** Actividades por día según la intensidad elegida. */
export const DAILY_GOAL_BY_INTENSITY: Readonly<Record<Intensity, number>> = { light: 3, normal: 5, pro: 7 };

const onboardingStateSchema = z.object({
  version: z.literal(ONBOARDING_VERSION),
  /** Marca de flujo en curso: guardar el nombre a mitad de camino no debe cerrarlo. */
  startedAt: z.iso.datetime().nullable().catch(null),
  completedAt: z.iso.datetime().nullable().catch(null),
  intensity: z.enum(INTENSITIES).catch("normal"),
});
export type OnboardingState = z.infer<typeof onboardingStateSchema>;

export const EMPTY_ONBOARDING_STATE: OnboardingState = {
  version: ONBOARDING_VERSION,
  startedAt: null,
  completedAt: null,
  intensity: "normal",
};

export function parseOnboardingState(raw: unknown): OnboardingState | null {
  const parsed = onboardingStateSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export const onboardingStore = createPersistentStore<OnboardingState>(
  "artikare_onboarding_v1",
  EMPTY_ONBOARDING_STATE,
  parseOnboardingState
);

export function needsOnboarding(state: OnboardingState, profile: PatientProfile): boolean {
  if (state.completedAt !== null) return false;
  if (state.startedAt !== null) return true;
  const hadProfileBefore = profile.name.trim() !== "" || profile.consent !== undefined;
  return !hadProfileBefore;
}

export function startOnboarding(now: Date = new Date()): void {
  const current = onboardingStore.getSnapshot();
  if (current.startedAt !== null || current.completedAt !== null) return;
  onboardingStore.write({ ...current, startedAt: now.toISOString() });
}

export function completeOnboarding(intensity: Intensity, now: Date = new Date()): void {
  onboardingStore.write({ ...onboardingStore.getSnapshot(), completedAt: now.toISOString(), intensity });
}

export function setIntensity(intensity: Intensity): void {
  onboardingStore.write({ ...onboardingStore.getSnapshot(), intensity });
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Edad cumplida en hora de Lima; null si la fecha no existe, es futura o no es plausible. */
export function ageFromBirthDate(birthDate: string, now: Date = new Date()): number | null {
  const match = ISO_DATE.exec(birthDate);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const asDate = new Date(Date.UTC(year, month - 1, day));
  if (asDate.getUTCMonth() !== month - 1 || asDate.getUTCDate() !== day) return null;
  const today = toLimaIsoDate(now);
  if (birthDate > today) return null;
  const [todayYear, todayMonthDay] = [Number(today.slice(0, 4)), today.slice(5)];
  const age = todayYear - year - (todayMonthDay < birthDate.slice(5) ? 1 : 0);
  return age >= PATIENT_AGE_MIN && age <= PATIENT_AGE_MAX ? age : null;
}

export interface ProfileStepInput {
  name: string;
  /** "" = prefiere no decirlo. */
  birthDate: string;
  /** null = prefiere no decirlo. */
  sex: Sex | null;
  menopausalStatus: MenopausalStatus | null;
}

export interface ProfileStepValue {
  name: string;
  age: number | null;
  sex: Sex | null;
  menopausalStatus: MenopausalStatus | null;
}

export type ProfileStepResult =
  | { ok: true; value: ProfileStepValue }
  | { ok: false; errors: Partial<Record<"name" | "birthDate", string>> };

const NAME_MAX = 40;
const nameSchema = z
  .string()
  .trim()
  .min(1, "Escribe tu nombre o cómo te gusta que te llamen.")
  .max(NAME_MAX, `Usa ${NAME_MAX} letras como máximo.`);

/** Valida el paso de perfil (Zod) y deriva la edad: la fecha de nacimiento no se guarda. */
export function validateProfileStep(input: ProfileStepInput, now: Date = new Date()): ProfileStepResult {
  const errors: Partial<Record<"name" | "birthDate", string>> = {};
  const name = nameSchema.safeParse(input.name);
  if (!name.success) errors.name = name.error.issues[0]?.message;
  const age = input.birthDate === "" ? null : ageFromBirthDate(input.birthDate, now);
  if (input.birthDate !== "" && age === null) errors.birthDate = "Revisa la fecha: debe ser un día que ya pasó.";
  if (!name.success || errors.birthDate) return { ok: false, errors };

  const menopausalStatus =
    input.sex === "femenino" && input.menopausalStatus && MENOPAUSAL_STATUSES.includes(input.menopausalStatus)
      ? input.menopausalStatus
      : null;
  return { ok: true, value: { name: name.data, age, sex: input.sex, menopausalStatus } };
}
