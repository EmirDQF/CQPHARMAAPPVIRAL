import { enqueueOutboxRequest, flushOutbox } from "@/lib/api/outbox";
import type { ConsentRecord } from "@/lib/privacy/consent";
import { createSupabaseBottleRepository } from "@/lib/repositories/bottles";
import { createSupabaseConsentRepository } from "@/lib/repositories/consents";
import { createSupabaseDexaScanRepository } from "@/lib/repositories/dexaScans";
import { createSupabaseDoseEventRepository } from "@/lib/repositories/doseEvents";
import { createSupabasePainLogRepository } from "@/lib/repositories/painLogs";
import { createSupabaseProfileRepository } from "@/lib/repositories/profile";
import { createLocalSyncRepositories, runAccountSync, type AccountSyncOutcome } from "@/lib/sync/runSync";
import { getBrowserSupabase } from "./client";

let inFlight: Promise<AccountSyncOutcome | null> | null = null;

async function runOnce(consent: ConsentRecord): Promise<AccountSyncOutcome | null> {
  const client = getBrowserSupabase();
  if (!client) return null;

  const { data } = await client.auth.getSession();
  const user = data.session?.user;
  // El respaldo es de la cuenta: una sesión anónima no respalda Mi Panel.
  if (!user || user.is_anonymous) return null;

  const outcome = await runAccountSync({
    userId: user.id,
    consent,
    local: createLocalSyncRepositories(),
    remote: {
      profile: createSupabaseProfileRepository(client),
      painLogs: createSupabasePainLogRepository(client),
      dexaScans: createSupabaseDexaScanRepository(client),
      doseEvents: createSupabaseDoseEventRepository(client),
      bottles: createSupabaseBottleRepository(client),
    },
    isConsentActiveOnServer: () => createSupabaseConsentRepository(client).hasActive("respaldo-cuenta"),
    enqueue: (batch) => enqueueOutboxRequest("/api/sync", { ...batch }, { containsPersonalData: true }),
  });
  if (outcome.status === "synced" && outcome.queuedForUpload > 0) void flushOutbox();
  return outcome;
}

/**
 * Un pase de respaldo con la sesión del navegador (C3). null = no aplica
 * (sin Supabase o sin cuenta). Llamadas simultáneas comparten el mismo pase.
 */
export function runBrowserAccountSync(consent: ConsentRecord): Promise<AccountSyncOutcome | null> {
  inFlight ??= runOnce(consent).finally(() => {
    inFlight = null;
  });
  return inFlight;
}
