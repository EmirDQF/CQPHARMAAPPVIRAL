import { NextRequest } from "next/server";
import { buildAvailableDays } from "@/lib/appointments/availability";
import { generateAppointmentCode } from "@/lib/appointments/generateCode";
import type { Appointment } from "@/lib/appointments/types";
import { apiError, apiSuccess } from "@/lib/api/response";
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
