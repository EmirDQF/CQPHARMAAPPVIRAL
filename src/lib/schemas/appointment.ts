import { z } from "zod";
import { APPOINTMENT_CODE_PATTERN } from "../appointments/generateCode";
import type {
  AppointmentBookedBy,
  AppointmentSlot,
  ClinicalServiceId,
} from "../appointments/types";
import { PATIENT_AGE_MAX, PATIENT_AGE_MIN } from "../clinical/constants";
import { timestampSchema, updatableRowColumns } from "./shared";

export const CLINICAL_SERVICE_IDS = [
  "densitometria",
  "consulta-reumatologia",
  "control-preventivo",
] as const satisfies readonly ClinicalServiceId[];
export const APPOINTMENT_SLOTS = ["manana", "tarde"] as const satisfies readonly AppointmentSlot[];
export const BOOKED_BY = ["propia", "hijo"] as const satisfies readonly AppointmentBookedBy[];
export const APPOINTMENT_STATUSES = ["solicitada", "confirmada", "cancelada", "atendida"] as const;

/** Mismo patrón que el CHECK de `appointments.patient_phone`. */
export const PATIENT_PHONE_PATTERN = /^[+0-9 -]{6,20}$/;

/**
 * Fila de `appointments`. El paciente no la inserta directamente: la crea la
 * RPC `create_appointment` (C4), que genera el código en el servidor.
 */
export const appointmentRowSchema = z.object({
  ...updatableRowColumns,
  code: z.string().regex(APPOINTMENT_CODE_PATTERN),
  service_id: z.enum(CLINICAL_SERVICE_IDS),
  appointment_date: z.iso.date(),
  slot: z.enum(APPOINTMENT_SLOTS),
  patient_name: z.string().min(2).max(120),
  patient_age: z.number().int().min(PATIENT_AGE_MIN).max(PATIENT_AGE_MAX),
  patient_phone: z.string().regex(PATIENT_PHONE_PATTERN),
  booked_by: z.enum(BOOKED_BY),
  status: z.enum(APPOINTMENT_STATUSES),
  consent_version: z.string().min(1).max(64),
  consent_at: timestampSchema,
});

/** Lo único que el paciente puede cambiar de su cita. */
export const appointmentCancelSchema = z.object({ status: z.literal("cancelada") });

export type AppointmentRow = z.infer<typeof appointmentRowSchema>;
