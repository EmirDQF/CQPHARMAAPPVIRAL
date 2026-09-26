import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { readPublicSupabaseEnv } from "@/lib/env";

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
