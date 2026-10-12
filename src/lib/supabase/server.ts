import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { parseBearerToken } from "@/lib/api/bearer";
import { readPublicSupabaseEnv } from "@/lib/env";

/** Token Bearer con el que se creó cada cliente de la app empaquetada (no hay sesión que leer). */
const bearerTokens = new WeakMap<SupabaseClient, string>();

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
  const { data, error } = await client.auth.getUser(bearerTokens.get(client));
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

  // App Android empaquetada: sin cookies de otro origen, la sesión llega como Bearer.
  // El token se valida igual con getUser(token) y RLS corre con ese JWT.
  const token = parseBearerToken((await headers()).get("authorization"));
  if (token) {
    const client = createClient(env.url, env.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    bearerTokens.set(client, token);
    return client;
  }

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
