import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { readPublicSupabaseEnv } from "@/lib/env";

/** Las cookies de sesión de Supabase empiezan con "sb-"; sin ellas no hay nada que refrescar. */
const SUPABASE_COOKIE_PREFIX = "sb-";

/**
 * Refresca la sesión de Supabase en cada request y reescribe sus cookies.
 * No protege ninguna ruta: el invitado sigue entrando a todo sin cuenta.
 */
export async function refreshSupabaseSession(request: NextRequest): Promise<NextResponse> {
  const env = readPublicSupabaseEnv();
  const hasSessionCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith(SUPABASE_COOKIE_PREFIX));
  if (!env || !hasSessionCookie) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  try {
    // getUser() valida el token con Supabase Auth y dispara el refresco si expiró.
    await supabase.auth.getUser();
  } catch {
    // Supabase caído o sin red: la página se sirve igual; el cliente reintenta el refresco.
    return NextResponse.next({ request });
  }
  return response;
}
