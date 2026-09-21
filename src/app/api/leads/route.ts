import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import type { RiskLevel } from "@/lib/types";

export interface RegisteredLead {
  id: string;
  chronologicalAge: number;
  articularAge: number;
  riskLevel: RiskLevel;
  phone: string | null;
  createdAt: string;
}

// Registro en memoria del proceso, igual que /api/appointments: sirve para
// analítica clínica básica hasta que se integre una base de datos real.
const registeredLeads: RegisteredLead[] = [];

const VALID_RISK_LEVELS: RiskLevel[] = ["bajo", "moderado", "alto"];

interface CreateLeadBody {
  chronologicalAge?: unknown;
  articularAge?: unknown;
  riskLevel?: unknown;
  phone?: unknown;
}

function validateCreateLeadBody(body: CreateLeadBody): string | null {
  if (
    typeof body.chronologicalAge !== "number" ||
    body.chronologicalAge <= 0 ||
    body.chronologicalAge >= 120
  ) {
    return "chronologicalAge inválido";
  }
  if (typeof body.articularAge !== "number" || body.articularAge <= 0 || body.articularAge >= 130) {
    return "articularAge inválido";
  }
  if (!VALID_RISK_LEVELS.includes(body.riskLevel as RiskLevel)) {
    return "riskLevel inválido";
  }
  if (body.phone !== undefined && body.phone !== null && typeof body.phone !== "string") {
    return "phone inválido";
  }
  return null;
}

export async function POST(request: NextRequest) {
  let body: CreateLeadBody;
  try {
    body = await request.json();
  } catch {
    return apiError("JSON inválido en el cuerpo de la petición");
  }

  const validationError = validateCreateLeadBody(body);
  if (validationError) {
    return apiError(validationError);
  }

  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  const lead: RegisteredLead = {
    id: `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    chronologicalAge: body.chronologicalAge as number,
    articularAge: body.articularAge as number,
    riskLevel: body.riskLevel as RiskLevel,
    phone: phone.length > 0 ? phone : null,
    createdAt: new Date().toISOString(),
  };

  registeredLeads.push(lead);

  return apiSuccess(lead, 201);
}
