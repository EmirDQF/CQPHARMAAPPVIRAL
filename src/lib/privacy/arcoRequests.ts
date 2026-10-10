import { z } from "zod";
import { ACCOUNT_DELETION_CONFIRMATION } from "../api/handleArcoDelete";
import type { AuthStatus } from "../auth/types";

/** Peticiones ARCO del navegador a la cuenta (las cookies de sesión viajan solas, mismo origen). */

/** Solo con sesión (anónima o cuenta) la cuenta puede tener datos del paciente. */
export function hasServerSession(status: AuthStatus): boolean {
  return status === "anonymous" || status === "account";
}

const exportResponseSchema = z.object({
  success: z.literal(true),
  data: z.record(z.string(), z.unknown()),
});

const deletionResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ deleted: z.literal(true) }),
});

export type AccountExportOutcome = { ok: true; data: Record<string, unknown> } | { ok: false };

export async function fetchAccountExport(fetcher: typeof fetch = fetch): Promise<AccountExportOutcome> {
  try {
    const response = await fetcher("/api/arco/export", { cache: "no-store", credentials: "same-origin" });
    if (!response.ok) return { ok: false };
    const parsed = exportResponseSchema.safeParse(await response.json());
    return parsed.success ? { ok: true, data: parsed.data.data } : { ok: false };
  } catch {
    return { ok: false };
  }
}

/** true solo si el servidor confirma que la cuenta se borró. */
export async function requestAccountDeletion(fetcher: typeof fetch = fetch): Promise<boolean> {
  try {
    const response = await fetcher("/api/arco/delete", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmacion: ACCOUNT_DELETION_CONFIRMATION }),
    });
    if (!response.ok) return false;
    return deletionResponseSchema.safeParse(await response.json()).success;
  } catch {
    return false;
  }
}
