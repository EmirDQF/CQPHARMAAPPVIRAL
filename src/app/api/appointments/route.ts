import { NextRequest } from "next/server";
import { buildAvailableDays } from "@/lib/appointments/availability";
import { generateAppointmentCode } from "@/lib/appointments/generateCode";
import type { Appointment } from "@/lib/appointments/types";
import { handleCreateAppointment } from "@/lib/api/handleCreateAppointment";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createSupabaseAppointmentRepository } from "@/lib/repositories/appointments";
import { createServerSupabase, readSessionRequester } from "@/lib/supabase/server";
import { createAppointmentBodySchema, describeValidationError } from "@/lib/api/schemas";

// Registro en memoria del proceso: no hay base de datos configurada todavía,
// así que este registro sirve para analítica/consulta de estado dentro de la
// misma instancia del servidor y se reinicia en cada despliegue o cold start.
const registeredAppointments: Appointment[] = [];

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("JSON inválido en el cuerpo de la petición");
  }

  // C4: con Supabase, la cita se guarda por la RPC create_appointment (límite y código en la base).
  const client = await createServerSupabase();
  if (client) {
    const result = await handleCreateAppointment({
      repository: createSupabaseAppointmentRepository(client),
      requester: await readSessionRequester(client),
      body,
    });
    if (result.status === 201) return apiSuccess(result.data, 201);
    const response = apiError(result.error, result.status);
    if (result.status === 429) response.headers.set("Retry-After", String(result.retryAfterSeconds));
    return response;
  }

  // Sin Supabase (modo solo invitado) se mantiene el registro en memoria anterior.
  const parsed = createAppointmentBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(`Datos de cita inválidos (${describeValidationError(parsed.error)})`);
  }

  const { code, ...input } = parsed.data;
  if (code && registeredAppointments.some((item) => item.code === code)) {
    return apiError("Ya existe una cita con ese código", 409);
  }
  const appointment: Appointment = {
    ...input,
    code: code ?? generateAppointmentCode(),
    createdAt: new Date().toISOString(),
  };

  registeredAppointments.push(appointment);

  return apiSuccess({ code: appointment.code }, 201);
}

// Sin búsqueda por código: un código adivinable no debe revelar datos de la cita.
// La consulta autenticada llega con Supabase (Fase 1).
export async function GET() {
  return apiSuccess({ availableDays: buildAvailableDays() });
}
