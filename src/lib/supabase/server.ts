import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { readPublicSupabaseEnv } from "@/lib/env";

/** Quién hace la petición según Supabase Auth. */
export interface SessionRequester {
  id: string;
  isAnonymous: boolean;
}

/**
 * Valida la sesión contra Supabase Auth (getUser revisa el token en el
 * servidor; getSession solo leería la cookie). null = sin sesión válida.
 */
export async function readSessionRequester(client: SupabaseClient): Promise<SessionRequester | null> {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, isAnonymous: data.user.is_anonymous === true };
}

/**
 * Cliente de servidor con la sesión del paciente (clave anon + cookies): toda
 * consulta pasa por RLS. La service role vive aparte, en un módulo "server-only" (C5).
 */
export async function createServerSupabase(): Promise<SupabaseClient | null> {
  const env = readPublicSupabaseEnv();
  if (!env) return null;

  const cookieStore = await cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Desde un Server Component no se pueden escribir cookies; proxy.ts ya refresca la sesión.
        }
      },
    },
  });
}
