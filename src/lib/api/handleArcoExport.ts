import type { RepositoryClient } from "../repositories/supabaseRows";
import { ARCO_RETRY_AFTER_SECONDS, type ArcoQuotaOutcome } from "./arcoRateLimit";
import type { SyncRequester } from "./handleSyncBatch";

/**
 * Derecho de acceso (Ley 29733): todo lo que la cuenta guarda del paciente,
 * con nombres legibles. Se lee con la sesión del paciente, así RLS garantiza
 * que solo sale lo propio. Lo borrado en suave sale en `papelera`.
 */
export const ACCOUNT_EXPORT_SECTIONS = [
  { name: "perfilMedico", table: "profiles" },
  { name: "consentimientos", table: "consents" },
  { name: "testsDeEdadArticular", table: "assessments" },
  { name: "densitometrias", table: "dexa_scans" },
  { name: "diarioDeDolorYRigidez", table: "pain_logs" },
  { name: "tomasRegistradas", table: "dose_events" },
  { name: "frascos", table: "bottles" },
  { name: "citas", table: "appointments" },
] as const;

export type AccountExport = Record<string, unknown> & {
  cuenta: { id: string; tipo: "cuenta" | "invitado" };
  papelera: unknown[];
};

export type ArcoExportResult =
  | { status: 200; data: AccountExport }
  | { status: 429; error: string; retryAfterSeconds: number }
  | { status: 401 | 503; error: string };

interface ArcoExportRequest {
  client: RepositoryClient;
  requester: SyncRequester | null;
  /** Cupo por usuario en la base (arcoRateLimit.ts). */
  consumeQuota: () => Promise<ArcoQuotaOutcome>;
}

class ExportReadError extends Error {}

async function readSection(client: RepositoryClient, table: string): Promise<unknown[]> {
  // Exportación completa: el derecho de acceso cubre todas las columnas propias.
  const { data, error } = await client.from(table).select("*");
  if (error) throw new ExportReadError(`exportar ${table}`);
  return data ?? [];
}

async function readTrash(client: RepositoryClient): Promise<unknown[]> {
  const { data, error } = await client.rpc("list_deleted_records");
  if (error) throw new ExportReadError("exportar papelera");
  return Array.isArray(data) ? data : [];
}

const EXPORT_UNAVAILABLE = "No se pudieron exportar los datos de la cuenta por el momento";

export async function handleArcoExport({
  client,
  requester,
  consumeQuota,
}: ArcoExportRequest): Promise<ArcoExportResult> {
  if (!requester) return { status: 401, error: "Se requiere una sesión para exportar los datos de la cuenta" };

  const quota = await consumeQuota();
  if (quota === "limited") {
    return {
      status: 429,
      error: "Pediste tus datos varias veces seguidas; inténtalo en una hora",
      retryAfterSeconds: ARCO_RETRY_AFTER_SECONDS,
    };
  }
  if (quota === "unavailable") return { status: 503, error: EXPORT_UNAVAILABLE };

  try {
    const [sections, papelera] = await Promise.all([
      Promise.all(
        ACCOUNT_EXPORT_SECTIONS.map(async ({ name, table }) => [name, await readSection(client, table)] as const)
      ),
      readTrash(client),
    ]);
    return {
      status: 200,
      data: {
        cuenta: { id: requester.id, tipo: requester.isAnonymous ? "invitado" : "cuenta" },
        ...Object.fromEntries(sections),
        papelera,
      },
    };
  } catch (error) {
    // Solo el nombre de la sección, nunca filas (son datos de salud).
    console.error("[arco] No se pudo exportar", error instanceof ExportReadError ? error.message : "error desconocido");
    return { status: 503, error: EXPORT_UNAVAILABLE };
  }
}
