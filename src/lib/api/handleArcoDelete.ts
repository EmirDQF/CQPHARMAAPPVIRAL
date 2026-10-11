import { z } from "zod";
import { ARCO_RETRY_AFTER_SECONDS, type ArcoQuotaOutcome } from "./arcoRateLimit";
import type { SyncRequester } from "./handleSyncBatch";

/**
 * Derecho de cancelación (Ley 29733) y borrado de cuenta en la app (App
 * Store 5.1.1(v)). Borra al usuario de Supabase Auth: `on delete cascade`
 * elimina en duro todo lo clínico y queda solo la prueba seudonimizada del
 * consentimiento. El id sale siempre de la sesión validada, nunca del cuerpo.
 */
export const ACCOUNT_DELETION_CONFIRMATION = "BORRAR MIS DATOS";

export const accountDeletionBodySchema = z.object({
  confirmacion: z.literal(ACCOUNT_DELETION_CONFIRMATION),
});

/** Lo único que se usa de la service role (vive en src/lib/supabase/admin.ts). */
export interface AccountDeleter {
  deleteUser(userId: string): Promise<{ error: { message: string } | null }>;
}

export type ArcoDeleteResult =
  | { status: 200; data: { deleted: true } }
  | { status: 429; error: string; retryAfterSeconds: number }
  | { status: 400 | 401 | 503; error: string };

interface ArcoDeleteRequest {
  requester: SyncRequester | null;
  body: unknown;
  deleter: AccountDeleter | null;
  /** Cupo por usuario en la base (arcoRateLimit.ts); se consume solo con una petición válida. */
  consumeQuota: () => Promise<ArcoQuotaOutcome>;
}

export async function handleArcoDelete({
  requester,
  body,
  deleter,
  consumeQuota,
}: ArcoDeleteRequest): Promise<ArcoDeleteResult> {
  if (!requester) return { status: 401, error: "Se requiere una sesión para borrar la cuenta" };
  if (!accountDeletionBodySchema.safeParse(body).success) {
    return { status: 400, error: "Falta la confirmación explícita del borrado" };
  }
  if (!deleter) return { status: 503, error: "El borrado de cuentas no está configurado" };

  const quota = await consumeQuota();
  if (quota === "limited") {
    return {
      status: 429,
      error: "Hiciste varias solicitudes de borrado seguidas; inténtalo en una hora",
      retryAfterSeconds: ARCO_RETRY_AFTER_SECONDS,
    };
  }
  if (quota === "unavailable") return { status: 503, error: "No se pudo borrar la cuenta por el momento" };

  const { error } = await deleter.deleteUser(requester.id);
  if (error) {
    console.error("[arco] No se pudo borrar la cuenta");
    return { status: 503, error: "No se pudo borrar la cuenta por el momento" };
  }
  return { status: 200, data: { deleted: true } };
}
