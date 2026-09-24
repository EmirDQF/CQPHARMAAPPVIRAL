import type { ConsentRecord } from "../privacy/consent";

export type ClinicalServiceId =
  | "densitometria"
  | "consulta-reumatologia"
  | "control-preventivo";

export type AppointmentSlot = "manana" | "tarde";

export type AppointmentBookedBy = "propia" | "hijo";

export interface ClinicalService {
  id: ClinicalServiceId;
  name: string;
  description: string;
  durationMinutes: number;
  prepInstructions: string | null;
}

export interface AppointmentPatient {
  name: string;
  age: number;
  phone: string;
  bookedBy: AppointmentBookedBy;
}

export interface Appointment {
  code: string;
  serviceId: ClinicalServiceId;
  date: string;
  slot: AppointmentSlot;
  patient: AppointmentPatient;
  createdAt: string;
  /** Opcional solo por compatibilidad con citas guardadas antes del consentimiento (v1). */
  consent?: ConsentRecord;
}
