import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";
import { RepositoryError } from "./types";

/** Lo que los adaptadores usan del cliente (de navegador o de servidor, siempre con RLS). */
export type RepositoryClient = Pick<SupabaseClient, "from" | "rpc">;

/** Tablas con borrado suave por la RPC `soft_delete_record` (C1.1). */
export type SoftDeletableTable = "dexa_scans" | "pain_logs" | "dose_events";

/**
 * Se queda con lo que cumple el esquema. Lo inválido se descarta y se cuenta,
 * nunca se registra su contenido (puede ser un dato clínico).
 */
export function keepValid<T>(items: readonly unknown[], schema: z.ZodType<T>, label: string): T[] {
  const valid = items.flatMap((item): T[] => {
    const result = schema.safeParse(item);
    return result.success ? [result.data] : [];
  });
  if (valid.length !== items.length) {
    console.error(`[repositorio] ${label}: ${items.length - valid.length} registros inválidos descartados`);
  }
  return valid;
}

export async function selectRows<T>(
  client: RepositoryClient,
  table: string,
  columns: string,
  schema: z.ZodType<T>
): Promise<T[]> {
  const { data, error } = await client.from(table).select(columns);
  if (error) throw new RepositoryError(`listar ${table}`, { cause: error });
  return keepValid(data ?? [], schema, table);
}

export async function upsertRows(
  client: RepositoryClient,
  table: string,
  rows: readonly Record<string, unknown>[],
  options: { onConflict: string; ignoreDuplicates?: boolean }
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await client.from(table).upsert([...rows], options);
  if (error) throw new RepositoryError(`guardar ${table}`, { cause: error });
}

/** Borra en suave las filas cuya `column` está en `values` (las ya borradas no aparecen por RLS). */
export async function softDeleteWhereIn(
  client: RepositoryClient,
  table: SoftDeletableTable,
  column: string,
  values: readonly string[]
): Promise<void> {
  if (values.length === 0) return;
  const { data, error } = await client.from(table).select(`id, ${column}`).in(column, [...values]);
  if (error) throw new RepositoryError(`buscar ${table} para borrar`, { cause: error });

  for (const row of (data ?? []) as unknown as { id: string }[]) {
    const { error: rpcError } = await client.rpc("soft_delete_record", { p_table: table, p_id: row.id });
    if (rpcError) throw new RepositoryError(`borrar ${table}`, { cause: rpcError });
  }
}
