import { NextRequest } from "next/server";
import { handleSyncBatch } from "@/lib/api/handleSyncBatch";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createServerSupabase, readSessionRequester } from "@/lib/supabase/server";

/** Respaldo de Mi Panel en la cuenta (C3). Lo llama la outbox, por lotes. */
export async function POST(request: NextRequest) {
  const client = await createServerSupabase();
  if (!client) return apiError("El respaldo no está configurado", 503);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("JSON inválido en el cuerpo de la petición");
  }

  const requester = await readSessionRequester(client);
  const result = await handleSyncBatch({ client, requester, body });
  return result.status === 200 ? apiSuccess(result.data) : apiError(result.error, result.status);
}
