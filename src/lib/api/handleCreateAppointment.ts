import type { AppointmentRepository } from "../repositories/appointments";
import type { SyncRequester } from "./handleSyncBatch";
import { createAppointmentBodySchema, describeValidationError } from "./schemas";

/** Ventana del límite de la RPC (1 hora): la outbox reintenta pasado ese tiempo. */
export const APPOINTMENT_RETRY_AFTER_SECONDS = 60 * 60;

export type CreateAppointmentResult =
  | { status: 201; data: { code: string } }
  | { status: 429; error: string; retryAfterSeconds: number }
  | { status: 400 | 401 | 503; error: string };

interface CreateAppointmentRequest {
  repository: AppointmentRepository;
  /** Sesión validada en el servidor; un invitado tiene sesión anónima. */
  requester: SyncRequester | null;
  body: unknown;
}

/**
 * Crea la cita por la RPC create_appointment (C4). Devuelve el código final:
 * el que propuso el celular, o uno nuevo si ya era de otra cita.
 */
export async function handleCreateAppointment({
  repository,
  requester,
  body,
}: CreateAppointmentRequest): Promise<CreateAppointmentResult> {
  if (!requester) return { status: 401, error: "Se requiere una sesión para registrar la cita" };

  const parsed = createAppointmentBodySchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, error: `Datos de cita inválidos (${describeValidationError(parsed.error)})` };
  }

  try {
    const result = await repository.create(parsed.data);
    if (!result.ok) {
      return {
        status: 429,
        error: "Alcanzaste el límite de citas por hora",
        retryAfterSeconds: APPOINTMENT_RETRY_AFTER_SECONDS,
      };
    }
    return { status: 201, data: { code: result.code } };
  } catch (error) {
    console.error("[citas] No se pudo registrar", error instanceof Error ? error.message : "error desconocido");
    return { status: 503, error: "No se pudo registrar la cita por el momento" };
  }
}
