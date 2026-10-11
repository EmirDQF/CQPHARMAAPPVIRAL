import "server-only";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { AccountDeleter } from "@/lib/api/handleArcoDelete";
import { readPublicSupabaseEnv } from "@/lib/env";

/**
 * Service role de Supabase: SOLO para rutas API del servidor (hoy, el borrado
 * de cuenta). Sin prefijo NEXT_PUBLIC_, Next nunca la incrusta en el cliente;
 * `server-only` rompe el build si un componente cliente lo importa, el guard
 * de `window` lo frena en tiempo de ejecución y architecture.test.ts solo
 * permite importarlo desde rutas API (src/app/api/**).
 */
const serviceRoleKeySchema = z.string().min(20);

function readServiceRoleKey(): string | null {
  const parsed = serviceRoleKeySchema.safeParse(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return parsed.success ? parsed.data : null;
}

/** null = sin Supabase o sin service role configurada (el borrado responde 503). */
export function createAccountDeleter(): AccountDeleter | null {
  if (typeof window !== "undefined") throw new Error("La service role no puede usarse en el navegador");

  const env = readPublicSupabaseEnv();
  const serviceRoleKey = readServiceRoleKey();
  if (!env || !serviceRoleKey) return null;

  const admin = createClient(env.url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return {
    async deleteUser(userId) {
      // Borrado en duro (shouldSoftDelete = false): la cascada elimina todo lo clínico.
      const { error } = await admin.auth.admin.deleteUser(userId, false);
      return { error: error ? { message: error.message } : null };
    },
  };
}
