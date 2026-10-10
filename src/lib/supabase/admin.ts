import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { AccountDeleter } from "@/lib/api/handleArcoDelete";
import { readPublicSupabaseEnv } from "@/lib/env";

/**
 * Service role de Supabase: SOLO para rutas API del servidor (hoy, el borrado
 * de cuenta). Sin prefijo NEXT_PUBLIC_, Next nunca la incrusta en el cliente;
 * además este módulo se niega a correr en el navegador. Pendiente: sumar el
 * paquete `server-only` (requiere instalar dependencias; ver docs/ROADMAP.md).
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
