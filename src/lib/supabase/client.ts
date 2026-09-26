import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readPublicSupabaseEnv } from "@/lib/env";

let browserClient: SupabaseClient | null | undefined;

/** Cliente de navegador (uno por pestaña). null = sin Supabase configurado → modo invitado. */
export function getBrowserSupabase(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (browserClient !== undefined) return browserClient;

  const env = readPublicSupabaseEnv();
  browserClient = env ? createBrowserClient(env.url, env.anonKey) : null;
  return browserClient;
}
