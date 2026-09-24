import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createLeadBodySchema, describeValidationError } from "@/lib/api/schemas";
import type { ConsentRecord } from "@/lib/privacy/consent";
import type { RiskLevel } from "@/lib/types";

export interface RegisteredLead {
  id: string;
  chronologicalAge: number;
  articularAge: number;
  riskLevel: RiskLevel;
  phone: string | null;
  consent: ConsentRecord | null;
  createdAt: string;
}

// Registro en memoria del proceso, igual que /api/appointments: sirve para
// analítica clínica básica hasta que se integre una base de datos real.
const registeredLeads: RegisteredLead[] = [];

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("JSON inválido en el cuerpo de la petición");
  }

  const parsed = createLeadBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(`Datos de lead inválidos (${describeValidationError(parsed.error)})`);
  }

  const lead: RegisteredLead = {
    id: `lead-${crypto.randomUUID()}`,
    chronologicalAge: parsed.data.chronologicalAge,
    articularAge: parsed.data.articularAge,
    riskLevel: parsed.data.riskLevel,
    phone: parsed.data.phone || null,
    consent: parsed.data.consent ?? null,
    createdAt: new Date().toISOString(),
  };

  registeredLeads.push(lead);

  return apiSuccess({ id: lead.id }, 201);
}
