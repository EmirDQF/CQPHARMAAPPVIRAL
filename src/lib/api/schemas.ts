import { z } from "zod";
import type { AppointmentBookedBy, AppointmentSlot, ClinicalServiceId } from "../appointments/types";
import { consentRecordSchema } from "../privacy/consent";
import type { RiskLevel } from "../types";

const CLINICAL_SERVICE_IDS = [
  "densitometria",
  "consulta-reumatologia",
  "control-preventivo",
] as const satisfies readonly ClinicalServiceId[];
const APPOINTMENT_SLOTS = ["manana", "tarde"] as const satisfies readonly AppointmentSlot[];
const BOOKED_BY = ["propia", "hijo"] as const satisfies readonly AppointmentBookedBy[];
const RISK_LEVELS = ["bajo", "moderado", "alto"] as const satisfies readonly RiskLevel[];

const MAX_HUMAN_AGE = 120;
const MAX_ARTICULAR_AGE = 130;

const phoneSchema = z
  .string()
  .trim()
  .min(6)
  .max(20)
  .regex(/^[+\d\s-]+$/);

export const createAppointmentBodySchema = z.object({
  code: z
    .string()
    .regex(/^ART-[A-Z0-9]{6}$/)
    .optional(),
  serviceId: z.enum(CLINICAL_SERVICE_IDS),
  date: z.iso.date(),
  slot: z.enum(APPOINTMENT_SLOTS),
  patient: z.object({
    name: z.string().trim().min(2).max(120),
    age: z.number().int().positive().lt(MAX_HUMAN_AGE),
    phone: phoneSchema,
    bookedBy: z.enum(BOOKED_BY),
  }),
  // Ley 29733: sin consentimiento explícito no se aceptan datos personales.
  consent: consentRecordSchema,
});

export type CreateAppointmentBody = z.infer<typeof createAppointmentBodySchema>;

export const createLeadBodySchema = z
  .object({
    chronologicalAge: z.number().int().positive().lt(MAX_HUMAN_AGE),
    articularAge: z.number().int().positive().lt(MAX_ARTICULAR_AGE),
    riskLevel: z.enum(RISK_LEVELS),
    phone: phoneSchema.nullish(),
    consent: consentRecordSchema.optional(),
  })
  .refine((lead) => !lead.phone || lead.consent !== undefined, {
    message: "Se requiere consentimiento para registrar un teléfono",
    path: ["consent"],
  });

export type CreateLeadBody = z.infer<typeof createLeadBodySchema>;

/** Mensaje de validación sin eco de valores: los datos del paciente no deben volver en errores ni logs. */
export function describeValidationError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "body"}: ${issue.code}`)
    .join("; ");
}
