import { NextRequest } from "next/server";
import { buildAvailableDays } from "@/lib/appointments/availability";
import { clinicalServices } from "@/lib/appointments/catalog";
import { generateAppointmentCode } from "@/lib/appointments/generateCode";
import type {
  Appointment,
  AppointmentBookedBy,
  AppointmentSlot,
  ClinicalServiceId,
} from "@/lib/appointments/types";
import { apiError, apiSuccess } from "@/lib/api/response";

// Registro en memoria del proceso: no hay base de datos configurada todavía,
// así que este registro sirve para analítica/consulta de estado dentro de la
// misma instancia del servidor y se reinicia en cada despliegue o cold start.
const registeredAppointments: Appointment[] = [];

const VALID_SERVICE_IDS: ClinicalServiceId[] = clinicalServices.map((service) => service.id);
const VALID_SLOTS: AppointmentSlot[] = ["manana", "tarde"];
const VALID_BOOKED_BY: AppointmentBookedBy[] = ["propia", "hijo"];

interface CreateAppointmentBody {
  code?: unknown;
  serviceId?: unknown;
  date?: unknown;
  slot?: unknown;
  patient?: {
    name?: unknown;
    age?: unknown;
    phone?: unknown;
    bookedBy?: unknown;
  };
}

function validateCreateAppointmentBody(body: CreateAppointmentBody): string | null {
  if (!VALID_SERVICE_IDS.includes(body.serviceId as ClinicalServiceId)) {
    return "serviceId inválido";
  }
  if (typeof body.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return "date inválida (formato esperado YYYY-MM-DD)";
  }
  if (!VALID_SLOTS.includes(body.slot as AppointmentSlot)) {
    return "slot inválido (esperado 'manana' o 'tarde')";
  }
  const patient = body.patient;
  if (!patient || typeof patient !== "object") {
    return "patient es requerido";
  }
  if (typeof patient.name !== "string" || patient.name.trim().length < 2) {
    return "patient.name inválido";
  }
  if (typeof patient.age !== "number" || patient.age <= 0 || patient.age >= 120) {
    return "patient.age inválido";
  }
  if (typeof patient.phone !== "string" || patient.phone.trim().length < 6) {
    return "patient.phone inválido";
  }
  if (!VALID_BOOKED_BY.includes(patient.bookedBy as AppointmentBookedBy)) {
    return "patient.bookedBy inválido";
  }
  return null;
}

export async function POST(request: NextRequest) {
  let body: CreateAppointmentBody;
  try {
    body = await request.json();
  } catch {
    return apiError("JSON inválido en el cuerpo de la petición");
  }

  const validationError = validateCreateAppointmentBody(body);
  if (validationError) {
    return apiError(validationError);
  }

  const patient = body.patient as {
    name: string;
    age: number;
    phone: string;
    bookedBy: AppointmentBookedBy;
  };

  const hasValidClientCode = typeof body.code === "string" && /^ART-[A-Z0-9]{6}$/.test(body.code);

  const appointment: Appointment = {
    code: hasValidClientCode ? (body.code as string) : generateAppointmentCode(),
    serviceId: body.serviceId as ClinicalServiceId,
    date: body.date as string,
    slot: body.slot as AppointmentSlot,
    patient: {
      name: patient.name.trim(),
      age: patient.age,
      phone: patient.phone.trim(),
      bookedBy: patient.bookedBy,
    },
    createdAt: new Date().toISOString(),
  };

  registeredAppointments.push(appointment);

  return apiSuccess(appointment, 201);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const appointment = registeredAppointments.find((item) => item.code === code);
    if (!appointment) {
      return apiError("No se encontró ninguna cita con ese código", 404);
    }
    return apiSuccess(appointment);
  }

  return apiSuccess({ availableDays: buildAvailableDays() });
}
