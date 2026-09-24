import { z } from "zod";
import { consentRecordSchema } from "../privacy/consent";
import { createPersistentStore } from "../storage/persistentStore";

/**
 * Cola persistente de envíos al backend. Si la red o el servidor fallan, el
 * payload se reintenta con backoff exponencial en lugar de perderse. Nunca
 * se registra el cuerpo en logs: puede contener datos personales de salud.
 */

export const OUTBOX_MAX_ATTEMPTS = 8;
const BASE_RETRY_DELAY_MS = 30_000;
const MAX_RETRY_DELAY_MS = 60 * 60_000;

const OUTBOX_ENDPOINTS = ["/api/appointments", "/api/leads"] as const;
export type OutboxEndpoint = (typeof OUTBOX_ENDPOINTS)[number];

const outboxEntrySchema = z.object({
  id: z.string().min(1),
  endpoint: z.enum(OUTBOX_ENDPOINTS),
  body: z.record(z.string(), z.unknown()),
  containsPersonalData: z.boolean(),
  attempts: z.number().int().nonnegative(),
  nextAttemptAt: z.number(),
});

export type OutboxEntry = z.infer<typeof outboxEntrySchema>;

export const outboxStore = createPersistentStore<OutboxEntry[]>("artikare_outbox_v1", []);

const payloadConsentSchema = z.object({ consent: consentRecordSchema });

interface EnqueueOptions {
  containsPersonalData: boolean;
  now?: number;
}

/**
 * Encola un envío. Devuelve false (y no encola) si el payload lleva datos
 * personales sin un registro de consentimiento válido (Ley 29733).
 */
export function enqueueOutboxRequest(
  endpoint: OutboxEndpoint,
  body: Record<string, unknown>,
  { containsPersonalData, now = Date.now() }: EnqueueOptions
): boolean {
  if (containsPersonalData && !payloadConsentSchema.safeParse(body).success) {
    console.error(`[outbox] Envío a ${endpoint} rechazado: datos personales sin consentimiento`);
    return false;
  }

  const entry: OutboxEntry = {
    id: crypto.randomUUID(),
    endpoint,
    body,
    containsPersonalData,
    attempts: 0,
    nextAttemptAt: now,
  };
  outboxStore.write([...outboxStore.getSnapshot(), entry]);
  return true;
}

function retryDelayMs(attempts: number): number {
  return Math.min(BASE_RETRY_DELAY_MS * 2 ** (attempts - 1), MAX_RETRY_DELAY_MS);
}

type SendOutcome = "sent" | "drop" | "retry";

async function sendEntry(entry: OutboxEntry, fetchImpl: typeof fetch): Promise<SendOutcome> {
  try {
    const response = await fetchImpl(entry.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry.body),
    });
    if (response.ok) return "sent";
    if (response.status >= 400 && response.status < 500) {
      console.error(`[outbox] ${entry.endpoint} rechazó el envío (HTTP ${response.status}); se descarta`);
      return "drop";
    }
    return "retry";
  } catch (error) {
    const reason = error instanceof Error ? error.name : "error desconocido";
    console.warn(`[outbox] ${entry.endpoint} sin conexión (${reason}); se reintentará`);
    return "retry";
  }
}

function applyOutcome(entryId: string, outcome: SendOutcome, now: number): void {
  const updated = outboxStore.getSnapshot().flatMap((entry): OutboxEntry[] => {
    if (entry.id !== entryId) return [entry];
    if (outcome !== "retry") return [];

    const attempts = entry.attempts + 1;
    if (attempts >= OUTBOX_MAX_ATTEMPTS) {
      console.error(`[outbox] ${entry.endpoint} falló ${attempts} veces; se descarta`);
      return [];
    }
    return [{ ...entry, attempts, nextAttemptAt: now + retryDelayMs(attempts) }];
  });
  outboxStore.write(updated);
}

function dropInvalidEntries(): OutboxEntry[] {
  const snapshot: unknown[] = outboxStore.getSnapshot();
  const valid = snapshot.filter(
    (entry): entry is OutboxEntry => outboxEntrySchema.safeParse(entry).success
  );
  if (valid.length !== snapshot.length) {
    console.error(`[outbox] ${snapshot.length - valid.length} entradas corruptas descartadas`);
    outboxStore.write(valid);
  }
  return valid;
}

interface FlushOptions {
  now?: number;
  fetchImpl?: typeof fetch;
}

let inFlightFlush: Promise<void> | null = null;

async function runFlush(now: number, fetchImpl: typeof fetch): Promise<void> {
  const dueEntries = dropInvalidEntries().filter((entry) => entry.nextAttemptAt <= now);
  for (const entry of dueEntries) {
    const outcome = await sendEntry(entry, fetchImpl);
    applyOutcome(entry.id, outcome, now);
  }
}

/** Envía las entradas vencidas. Llamadas simultáneas comparten el mismo vaciado. */
export function flushOutbox({ now = Date.now(), fetchImpl = fetch }: FlushOptions = {}): Promise<void> {
  if (inFlightFlush) return inFlightFlush;

  inFlightFlush = runFlush(now, fetchImpl)
    .catch((error: unknown) => {
      console.error(
        "[outbox] Error inesperado al vaciar la cola",
        error instanceof Error ? error.name : "error desconocido"
      );
    })
    .finally(() => {
      inFlightFlush = null;
    });
  return inFlightFlush;
}
