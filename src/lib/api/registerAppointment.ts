import type { Appointment } from "../appointments/types";
import { enqueueOutboxRequest, flushOutbox } from "./outbox";

/**
 * Envía la cita al backend a través del outbox. La cita ya quedó guardada en
 * el store local (fuente de verdad de la UI); sin consentimiento registrado
 * el outbox la rechaza y los datos personales nunca salen del dispositivo.
 */
export function registerAppointmentForAnalytics(appointment: Appointment): void {
  const queued = enqueueOutboxRequest(
    "/api/appointments",
    {
      code: appointment.code,
      serviceId: appointment.serviceId,
      date: appointment.date,
      slot: appointment.slot,
      patient: appointment.patient,
      consent: appointment.consent,
    },
    { containsPersonalData: true }
  );
  if (queued) void flushOutbox();
}
