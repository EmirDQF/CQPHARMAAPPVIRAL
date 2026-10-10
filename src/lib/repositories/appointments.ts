import { APPOINTMENT_CODE_PATTERN } from "../appointments/generateCode";
import type { CreateAppointmentBody } from "../api/schemas";
import type { RepositoryClient } from "./supabaseRows";
import { RepositoryError } from "./types";

/** Cita tal como llega validada a /api/appointments; el código lo propone el celular. */
export type AppointmentRequest = CreateAppointmentBody;

export type CreateAppointmentResult =
  | { ok: true; code: string }
  | { ok: false; reason: "rate-limited" };

/** El paciente no inserta citas: solo la RPC create_appointment (C4) las crea. */
export interface AppointmentRepository {
  create(request: AppointmentRequest): Promise<CreateAppointmentResult>;
}

/** SQLSTATE con que la RPC informa el límite de citas por hora. */
const RATE_LIMITED_SQLSTATE = "P0429";

export function createSupabaseAppointmentRepository(client: RepositoryClient): AppointmentRepository {
  return {
    async create({ code, serviceId, date, slot, patient, consent }) {
      const { data, error } = await client.rpc("create_appointment", {
        p_code: code ?? null,
        p_service_id: serviceId,
        p_appointment_date: date,
        p_slot: slot,
        p_patient_name: patient.name,
        p_patient_age: patient.age,
        p_patient_phone: patient.phone,
        p_booked_by: patient.bookedBy,
        p_consent_version: consent.consentVersion,
        p_consent_at: consent.consentAt,
      });
      if (error?.code === RATE_LIMITED_SQLSTATE) return { ok: false, reason: "rate-limited" };
      if (error) throw new RepositoryError("crear appointments", { cause: error });
      if (typeof data !== "string" || !APPOINTMENT_CODE_PATTERN.test(data)) {
        throw new RepositoryError("leer el código de appointments");
      }
      return { ok: true, code: data };
    },
  };
}
