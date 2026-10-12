import { z } from "zod";
import { parseProfileAgeInput, type PatientProfile } from "../dashboard/patientProfile";
import type { MenopausalStatus } from "../clinical/tScoreEligibility";
import { isConsentCurrent } from "../privacy/consent";
import { createPersistentStore } from "../storage/persistentStore";
import type { Sex } from "../types";

/**
 * Primer arranque de /app (splash → bienvenida de Artiko → consentimiento →
 * perfil → metas → Hoy). Se guarda local (`artikare_onboarding_v1`, sin datos
 * de salud) y se ejecuta una sola vez. Quien ya tenía perfil no lo repite.
 */
export const ONBOARDING_VERSION = 1;
export const INTENSITIES = ["light", "normal", "pro"] as const;
export type Intensity = (typeof INTENSITIES)[number];

/** Actividades por día según la intensidad elegida. */
export const DAILY_GOAL_BY_INTENSITY: Readonly<Record<Intensity, number>> = { light: 3, normal: 5, pro: 7 };

/** Días antes de volver a ofrecer completar el perfil a quien entró como invitado y tocó "Ahora no". */
export const PROFILE_OFFER_SNOOZE_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

const onboardingStateSchema = z.object({
  version: z.literal(ONBOARDING_VERSION),
  /** Marca de flujo en curso: guardar el nombre a mitad de camino no debe cerrarlo. */
  startedAt: z.iso.datetime().nullable().catch(null),
  completedAt: z.iso.datetime().nullable().catch(null),
  intensity: z.enum(INTENSITIES).catch("normal"),
  /** Último "Ahora no" a la invitación de completar el perfil desde Hoy. */
  profileOfferSnoozedAt: z.iso.datetime().nullable().catch(null),
});
export type OnboardingState = z.infer<typeof onboardingStateSchema>;

export const EMPTY_ONBOARDING_STATE: OnboardingState = {
  version: ONBOARDING_VERSION,
  startedAt: null,
  completedAt: null,
  intensity: "normal",
  profileOfferSnoozedAt: null,
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

/**
 * Invitado (negó el consentimiento en el primer arranque): Hoy le vuelve a
 * ofrecer completar su perfil, salvo que haya dicho "Ahora no" hace poco.
 */
export function shouldOfferProfileCompletion(state: OnboardingState, profile: PatientProfile, now: Date = new Date()): boolean {
  if (state.completedAt === null || isConsentCurrent(profile.consent)) return false;
  if (state.profileOfferSnoozedAt === null) return true;
  return now.getTime() - Date.parse(state.profileOfferSnoozedAt) >= PROFILE_OFFER_SNOOZE_DAYS * DAY_MS;
}

export function snoozeProfileOffer(now: Date = new Date()): void {
  onboardingStore.write({ ...onboardingStore.getSnapshot(), profileOfferSnoozedAt: now.toISOString() });
}

/** Preguntas del perfil, una por pantalla. La de menopausia solo aparece si el sexo es femenino. */
export type ProfileQuestion = "name" | "age" | "sex" | "menopause" | "fracture";

export interface ProfileDraft {
  name: string;
  age: number | null;
  sex: Sex | null;
  menopausalStatus: MenopausalStatus | null;
  /** null = prefiere no decirlo (nunca se asume "No"). */
  hasFractureHistory: boolean | null;
}

export const EMPTY_PROFILE_DRAFT: ProfileDraft = {
  name: "",
  age: null,
  sex: null,
  menopausalStatus: null,
  hasFractureHistory: null,
};

export function profileQuestions(draft: Pick<ProfileDraft, "sex">): readonly ProfileQuestion[] {
  return draft.sex === "femenino"
    ? ["name", "age", "sex", "menopause", "fracture"]
    : ["name", "age", "sex", "fracture"];
}

const NAME_MAX = 40;
const nameSchema = z
  .string()
  .trim()
  .min(1, "Escribe tu nombre o cómo te gusta que te llamen.")
  .max(NAME_MAX, `Usa ${NAME_MAX} letras como máximo.`);

export type FieldResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function validateFirstRunName(raw: string): FieldResult<string> {
  const parsed = nameSchema.safeParse(raw);
  return parsed.success ? { ok: true, value: parsed.data } : { ok: false, error: parsed.error.issues[0]?.message ?? "" };
}

/** Edad en años con teclado numérico; vacío = prefiere no decirlo. Misma regla que el perfil. */
export function validateFirstRunAge(raw: string): FieldResult<number | null> {
  const parsed = parseProfileAgeInput(raw);
  return parsed.ok ? parsed : { ok: false, error: `${parsed.error}, o déjalo vacío si prefieres no decirlo.` };
}
