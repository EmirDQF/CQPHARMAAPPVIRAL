import { NextRequest } from "next/server";
import { handleRecordAssessment } from "@/lib/api/handleRecordAssessment";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createSupabaseAssessmentRepository } from "@/lib/repositories/assessments";
import { createServerSupabase, readSessionRequester } from "@/lib/supabase/server";

/** Resumen del Test de Edad Articular (C4). Lo llama la outbox cuando ya hay sesión. */
export async function POST(request: NextRequest) {
  const client = await createServerSupabase();
  if (!client) return apiError("El guardado de evaluaciones no está configurado", 503);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("JSON inválido en el cuerpo de la petición");
  }

  const result = await handleRecordAssessment({
    repository: createSupabaseAssessmentRepository(client),
    requester: await readSessionRequester(client),
    body,
  });
  return result.status === 201 ? apiSuccess(result.data, 201) : apiError(result.error, result.status);
}
