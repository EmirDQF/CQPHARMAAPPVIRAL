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
  const appointment: Appointment = {
    ...input,
    code: code ?? generateAppointmentCode(),
    createdAt: new Date().toISOString(),
  };

  registeredAppointments.push(appointment);

  return apiSuccess({ code: appointment.code }, 201);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const appointment = registeredAppointments.find((item) => item.code === code);
    if (!appointment) {
      return apiError("No se encontró ninguna cita con ese código", 404);
    }
    // El código viaja en la URL: la respuesta nunca incluye datos personales.
    return apiSuccess({
      code: appointment.code,
      serviceId: appointment.serviceId,
      date: appointment.date,
      slot: appointment.slot,
    });
  }

  return apiSuccess({ availableDays: buildAvailableDays() });
}
