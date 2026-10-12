import { NextRequest } from "next/server";
import { consumeArcoQuota } from "@/lib/api/arcoRateLimit";
import { handleArcoDelete } from "@/lib/api/handleArcoDelete";
import { apiError, apiSuccess } from "@/lib/api/response";
import { hasBearerAuthorization, isSameOriginRequest } from "@/lib/api/sameOrigin";
import { createAccountDeleter } from "@/lib/supabase/admin";
import { createServerSupabase, readSessionRequester } from "@/lib/supabase/server";

/** Derecho de cancelación: borra la cuenta de la sesión y, en cascada, todos sus datos. */
export async function POST(request: NextRequest) {
  // La confirmación del cuerpo es pública: lo que frena el CSRF es exigir mismo origen (o un Bearer, que no viaja como cookie).
  if (!isSameOriginRequest(request.headers) && !hasBearerAuthorization(request.headers)) return apiError("Origen no permitido", 403);

  const client = await createServerSupabase();
  if (!client) return apiError("El borrado de cuentas no está configurado", 503);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("JSON inválido en el cuerpo de la petición");
  }

  const requester = await readSessionRequester(client);
  const result = await handleArcoDelete({
    requester,
    body,
    deleter: createAccountDeleter(),
    consumeQuota: () => consumeArcoQuota(client, "delete"),
  });
  if (result.status !== 200) {
    const response = apiError(result.error, result.status);
    if (result.status === 429) response.headers.set("Retry-After", String(result.retryAfterSeconds));
    return response;
  }

  // La cuenta ya no existe: se cierran las cookies de sesión de este navegador.
  await client.auth.signOut({ scope: "local" }).catch(() => undefined);
  const response = apiSuccess(result.data);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
