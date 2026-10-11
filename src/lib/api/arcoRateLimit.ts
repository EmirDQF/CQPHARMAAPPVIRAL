import { z } from "zod";
import type { RepositoryClient } from "../repositories/supabaseRows";

/**
 * Límite de frecuencia de los derechos ARCO, guardado en la base (tabla
 * `arco_requests` y RPC `consume_arco_quota`): compartido entre instancias,
 * nunca en memoria. Es por usuario porque ambas rutas exigen sesión validada;
 * la IP no sirve detrás del NAT de las operadoras móviles. Riesgo aceptado:
 * cada sesión anónima nueva trae cupo propio; crearlas en masa lo frena el
 * captcha (Turnstile) del inicio de sesión, no este límite. Los valores deben
 * coincidir con la migración 20261010140000 (lo verifica sqlParity.test.ts).
 */
export const ARCO_HOURLY_LIMITS = { export: 10, delete: 3 } as const;

/** Ventana del límite (1 hora): el cliente puede reintentar pasado ese tiempo. */
export const ARCO_RETRY_AFTER_SECONDS = 60 * 60;

export type ArcoRequestKind = keyof typeof ARCO_HOURLY_LIMITS;
export type ArcoQuotaOutcome = "allowed" | "limited" | "unavailable";

const quotaResponseSchema = z.boolean();

/** Ante cualquier fallo responde "unavailable": sin cupo verificable no se actúa. */
export async function consumeArcoQuota(client: RepositoryClient, kind: ArcoRequestKind): Promise<ArcoQuotaOutcome> {
  const { data, error } = await client.rpc("consume_arco_quota", { p_kind: kind });
  const parsed = quotaResponseSchema.safeParse(data);
  if (error || !parsed.success) {
    console.error("[arco] No se pudo verificar el límite de solicitudes", kind);
    return "unavailable";
  }
  return parsed.data ? "allowed" : "limited";
}
