import { z } from "zod";
import { APPOINTMENT_CODE_PATTERN } from "../appointments/generateCode";
import { appointmentsStore } from "../appointments/store";
import type { Appointment } from "../appointments/types";
import {
  enqueueOutboxRequest,
  flushOutbox,
  registerOutboxSentHandler,
  type OutboxEntry,
} from "./outbox";

const createdAppointmentSchema = z.object({
  data: z.object({ code: z.string().regex(APPOINTMENT_CODE_PATTERN) }),
});

/**
 * El celular propone el código; si ya era de otra cita (≈1 en mil millones),
 * la RPC asigna otro y la cita local lo adopta para mostrar el correcto.
 */
export async function applyServerAppointmentCode(entry: OutboxEntry, response: Response): Promise<void> {
  const proposedCode = entry.body.code;
  const parsed = createdAppointmentSchema.safeParse(await response.json());
  if (!parsed.success) {
    console.error("[citas] Respuesta de cita sin un código válido");
    return;
  }
  const finalCode = parsed.data.data.code;
  if (typeof proposedCode !== "string" || finalCode === proposedCode) return;

  appointmentsStore.write(
    appointmentsStore
      .getSnapshot()
      .map((appointment) => (appointment.code === proposedCode ? { ...appointment, code: finalCode } : appointment))
  );
}

/** Lo registra OutboxSync: así funciona aunque el envío ocurra en otra pantalla. */
export function installAppointmentCodeSync(): () => void {
  return registerOutboxSentHandler("/api/appointments", applyServerAppointmentCode);
}

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
