import type { Appointment } from "../appointments/types";

/**
 * Envío best-effort al backend para analítica clínica. La cita ya quedó
 * guardada en el store local (fuente de verdad de la UI); si esta llamada
 * falla no debe interrumpir la confirmación que ya ve el paciente.
 */
export function registerAppointmentForAnalytics(appointment: Appointment): void {
  fetch("/api/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: appointment.code,
      serviceId: appointment.serviceId,
      date: appointment.date,
      slot: appointment.slot,
      patient: appointment.patient,
    }),
  }).catch(() => {});
}
