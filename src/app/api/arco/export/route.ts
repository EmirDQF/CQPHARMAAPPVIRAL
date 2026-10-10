import { handleArcoExport } from "@/lib/api/handleArcoExport";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createServerSupabase, readSessionRequester } from "@/lib/supabase/server";

/** Derecho de acceso: JSON con todo lo que la cuenta guarda del paciente (RLS). */
export async function GET() {
  const client = await createServerSupabase();
  if (!client) return apiError("La exportación de la cuenta no está configurada", 503);

  const requester = await readSessionRequester(client);
  const result = await handleArcoExport({ client, requester });
  const response = result.status === 200 ? apiSuccess(result.data) : apiError(result.error, result.status);
  // Datos de salud: ni el navegador ni un proxy deben guardar esta respuesta.
  response.headers.set("Cache-Control", "no-store");
  return response;
}
