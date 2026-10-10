import { NextRequest } from "next/server";
import { handleArcoDelete } from "@/lib/api/handleArcoDelete";
import { apiError, apiSuccess } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/sameOrigin";
import { createAccountDeleter } from "@/lib/supabase/admin";
import { createServerSupabase, readSessionRequester } from "@/lib/supabase/server";

/** Derecho de cancelación: borra la cuenta de la sesión y, en cascada, todos sus datos. */
export async function POST(request: NextRequest) {
  // La confirmación del cuerpo es pública: lo que frena el CSRF es exigir mismo origen.
  if (!isSameOriginRequest(request.headers)) return apiError("Origen no permitido", 403);

  const client = await createServerSupabase();
  if (!client) return apiError("El borrado de cuentas no está configurado", 503);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("JSON inválido en el cuerpo de la petición");
  }

  const requester = await readSessionRequester(client);
  const result = await handleArcoDelete({ requester, body, deleter: createAccountDeleter() });
  if (result.status !== 200) return apiError(result.error, result.status);

  // La cuenta ya no existe: se cierran las cookies de sesión de este navegador.
  await client.auth.signOut({ scope: "local" }).catch(() => undefined);
  return apiSuccess(result.data);
}
