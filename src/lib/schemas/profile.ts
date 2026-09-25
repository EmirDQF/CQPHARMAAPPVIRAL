import { z } from "zod";
import { PATIENT_AGE_MAX, PATIENT_AGE_MIN } from "../clinical/constants";
import { MENOPAUSAL_STATUSES } from "../clinical/tScoreEligibility";
import type { Sex } from "../types";
import { timestampSchema } from "./shared";

export const SEXES = ["femenino", "masculino"] as const satisfies readonly Sex[];

/** Topes de texto libre; replican los CHECK de `profiles`. */
export const PROFILE_TEXT_MAX = { name: 200, allergies: 2000, phone: 30 } as const;
/** Tope plausible de peso; replica el CHECK de `profiles.weight_kg`. */
export const PROFILE_WEIGHT_MAX_KG = 500;

/** Lo que el cliente envía a `profiles` (el `id` lo pone la base con auth.uid()). */
export const profileUpsertSchema = z.object({
  name: z.string().trim().max(PROFILE_TEXT_MAX.name),
  age: z.number().int().min(PATIENT_AGE_MIN).max(PATIENT_AGE_MAX).nullable(),
  sex: z.enum(SEXES).nullable(),
  menopausal_status: z.enum(MENOPAUSAL_STATUSES).nullable(),
  /** null = sin responder (nunca se asume "No"). */
  has_fracture_history: z.boolean().nullable(),
  weight_kg: z.number().positive().max(PROFILE_WEIGHT_MAX_KG).nullable(),
  allergies: z.string().trim().max(PROFILE_TEXT_MAX.allergies),
  phone: z.string().trim().max(PROFILE_TEXT_MAX.phone),
});

export const profileRowSchema = profileUpsertSchema.extend({
  id: z.uuid(),
  created_at: timestampSchema,
  updated_at: timestampSchema,
});

export type ProfileUpsert = z.infer<typeof profileUpsertSchema>;
export type ProfileRow = z.infer<typeof profileRowSchema>;
