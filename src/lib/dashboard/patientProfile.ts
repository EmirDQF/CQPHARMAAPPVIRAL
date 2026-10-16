import { z } from "zod";
import { menopausalStatusSchema, type MenopausalStatus } from "../clinical/tScoreEligibility";
import { consentRecordSchema, type ConsentRecord } from "../privacy/consent";
import { createPersistentStore } from "../storage/persistentStore";
import type { Sex } from "../types";

export interface PatientProfile {
  name: string;
  age: number | null;
  sex: Sex | null;
  weightKg: number | null;
  /** null = el paciente aún no respondió (nunca se asume "No"). */
  hasFractureHistory: boolean | null;
  /** Solo aplica a mujeres; decide si el semáforo OMS por T-score es válido. */
  menopausalStatus: MenopausalStatus | null;
  allergies: string;
  phone: string;
  /** Ausente en perfiles guardados antes del consentimiento (v1): se pide al volver a guardar. */
  consent?: ConsentRecord;
  /** Última edición local (ISO); ausente en perfiles previos a C3. Decide los conflictos al sincronizar. */
  updatedAt?: string;
}

export const emptyPatientProfile: PatientProfile = {
  name: "",
  age: null,
  sex: null,
  weightKg: null,
  hasFractureHistory: null,
  menopausalStatus: null,
  allergies: "",
  phone: "",
};

const MAX_HUMAN_AGE = 120;
const AGE_INPUT_PATTERN = /^\d{1,3}$/;

export type ProfileAgeInputResult = { ok: true; value: number | null } | { ok: false; error: string };

/** Misma regla que la lectura del perfil guardado: entero de 1 a 119, o vacío. */
export function parseProfileAgeInput(raw: string): ProfileAgeInputResult {
  const trimmed = raw.trim();
  if (trimmed === "") return { ok: true, value: null };
  const age = Number(trimmed);
  if (!AGE_INPUT_PATTERN.test(trimmed) || age < 1 || age >= MAX_HUMAN_AGE) {
    return { ok: false, error: `Ingresa tu edad en años (1 a ${MAX_HUMAN_AGE - 1})` };
  }
  return { ok: true, value: age };
}

// Cada campo se valida por separado: un dato corrupto se vacía sin perder el resto.
const storedProfileSchema = z.object({
  name: z.string().catch(""),
  age: z.number().int().positive().lt(MAX_HUMAN_AGE).nullable().catch(null),
  sex: z.enum(["femenino", "masculino"]).nullable().catch(null),
  weightKg: z.number().positive().nullable().catch(null),
  hasFractureHistory: z.boolean().nullable().catch(null),
  menopausalStatus: menopausalStatusSchema.nullable().catch(null),
  allergies: z.string().catch(""),
  phone: z.string().catch(""),
  consent: consentRecordSchema.optional().catch(undefined),
  updatedAt: z.iso.datetime().optional().catch(undefined),
});

/**
 * Lee artikare_patient_profile_v1 sin perder datos. En v1 el antecedente de
 * fractura era `false` por defecto: sin consentimiento guardado no hay
 * evidencia de que el paciente respondiera, así que pasa a "no registrado".
 */
export function normalizeStoredPatientProfile(raw: unknown): PatientProfile | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;

  const { consent, updatedAt, ...profile } = storedProfileSchema.parse(raw);
  const hasFractureHistory =
    profile.hasFractureHistory === false && !consent ? null : profile.hasFractureHistory;

  return {
    ...profile,
    hasFractureHistory,
    ...(consent ? { consent } : {}),
    ...(updatedAt ? { updatedAt } : {}),
  };
}

export const patientProfileStore = createPersistentStore<PatientProfile>(
  "artikare_patient_profile_v1",
  emptyPatientProfile,
  normalizeStoredPatientProfile
);

/** Guarda el perfil con la hora de edición, que decide los conflictos al sincronizar (C3). */
export function savePatientProfile(profile: Omit<PatientProfile, "updatedAt">): void {
  patientProfileStore.write({ ...profile, updatedAt: new Date().toISOString() });
}
