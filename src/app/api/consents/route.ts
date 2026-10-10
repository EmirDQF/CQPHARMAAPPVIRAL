import { NextRequest } from "next/server";
import { handleConsentGrant } from "@/lib/api/handleConsentGrant";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createServerSupabase, readSessionRequester } from "@/lib/supabase/server";

/** Registra el consentimiento `respaldo-cuenta` (C3). Lo llama la outbox. */
export async function POST(request: NextRequest) {
  const client = await createServerSupabase();
  if (!client) return apiError("El registro de consentimientos no está configurado", 503);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("JSON inválido en el cuerpo de la petición");
  }

  const requester = await readSessionRequester(client);
  const result = await handleConsentGrant({ client, requester, body });
  return result.status === 201 ? apiSuccess(result.data, 201) : apiError(result.error, result.status);
}
