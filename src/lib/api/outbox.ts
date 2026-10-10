import { z } from "zod";
import { consentRecordSchema } from "../privacy/consent";
import { createPersistentStore } from "../storage/persistentStore";

/**
 * Cola persistente de envíos al backend. Si la red o el servidor fallan, el
 * payload se reintenta con backoff exponencial (con jitter) en lugar de
 * perderse. Lo que el servidor rechaza por datos inválidos pasa a una cola de
 * errores local desde la que se puede reintentar. Nunca se registra el cuerpo
 * en logs: puede contener datos personales de salud.
 *
 * Clases de fallo:
 * - Sin conexión (navigator.onLine false o fetch lanza): no gasta intentos.
 * - 408 / 429: se reintenta sin gastar intentos (respeta Retry-After).
 * - 401: aún no hay sesión (p. ej. el invitado no completó el captcha); se
 *   reintenta sin gastar intentos y sale en cuanto exista la sesión.
 * - 5xx: gasta un intento; al llegar a OUTBOX_MAX_SERVER_FAILURES → cola de errores.
 * - Otros 4xx: directo a la cola de errores (no se descarta).
 */

export const OUTBOX_MAX_SERVER_FAILURES = 3;
export const OUTBOX_BASE_RETRY_DELAY_MS = 30_000;
export const OUTBOX_MAX_RETRY_DELAY_MS = 60 * 60_000;
export const OUTBOX_DEAD_LETTER_STORAGE_KEY = "artikare_outbox_dead_v1";
export const OUTBOX_DEAD_LETTER_LIMIT = 50;
export const OUTBOX_DEAD_LETTER_MAX_AGE_MS = 30 * 24 * 60 * 60_000;

const OUTBOX_STORAGE_KEY = "artikare_outbox_v1";
const MS_PER_SECOND = 1000;
const RETRYABLE_CLIENT_STATUSES: readonly number[] = [408, 429];
const UNAUTHORIZED_STATUS = 401;
const SERVER_ERROR_MIN_STATUS = 500;

// /api/sync y /api/consents: respaldo de Mi Panel en la cuenta (C3); /api/assessments: C4.
const OUTBOX_ENDPOINTS = [
  "/api/appointments",
  "/api/leads",
  "/api/sync",
  "/api/consents",
  "/api/assessments",
] as const;
export type OutboxEndpoint = (typeof OUTBOX_ENDPOINTS)[number];

const outboxEntrySchema = z.object({
  id: z.string().min(1),
  endpoint: z.enum(OUTBOX_ENDPOINTS),
  body: z.record(z.string(), z.unknown()),
  containsPersonalData: z.boolean(),
  /** Fallos reales de servidor (5xx). Solo estos acercan la entrada a la cola de errores. */
  attempts: z.number().int().nonnegative(),
  /** Reintentos de cualquier clase; solo alimenta el backoff. */
  retries: z.number().int().nonnegative().default(0),
  nextAttemptAt: z.number(),
});

export type OutboxEntry = z.infer<typeof outboxEntrySchema>;

const deadLetterSchema = z.object({
  id: z.string().min(1),
  endpoint: z.enum(OUTBOX_ENDPOINTS),
  body: z.record(z.string(), z.unknown()),
  containsPersonalData: z.boolean(),
  status: z.number().int(),
  failedAt: z.number(),
});

export type DeadLetterEntry = z.infer<typeof deadLetterSchema>;

function parseValidItems<T>(raw: unknown, schema: z.ZodType<T>): T[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.flatMap((item): T[] => {
    const result = schema.safeParse(item);
    return result.success ? [result.data] : [];
  });
}

/** Valida lo leído de localStorage: descarta entradas corruptas sin romper la app. */
export function parseOutboxEntries(raw: unknown): OutboxEntry[] | null {
  return parseValidItems(raw, outboxEntrySchema);
}

function withoutExpired(entries: readonly DeadLetterEntry[], now: number): DeadLetterEntry[] {
  return entries.filter((entry) => now - entry.failedAt <= OUTBOX_DEAD_LETTER_MAX_AGE_MS);
}

/** Valida la cola de errores y purga lo que tenga más de 30 días. */
export function parseDeadLetters(raw: unknown, now = Date.now()): DeadLetterEntry[] | null {
  const valid = parseValidItems(raw, deadLetterSchema);
  return valid && withoutExpired(valid, now);
}

export const outboxStore = createPersistentStore<OutboxEntry[]>(
  OUTBOX_STORAGE_KEY,
  [],
  parseOutboxEntries
);

export const deadLetterStore = createPersistentStore<DeadLetterEntry[]>(
  OUTBOX_DEAD_LETTER_STORAGE_KEY,
  [],
  (raw) => parseDeadLetters(raw)
);

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
    retries: 0,
    nextAttemptAt: now,
  };
  outboxStore.write([...outboxStore.getSnapshot(), entry]);
  return true;
}

/**
 * Backoff exponencial con "equal jitter": la espera cae en la mitad superior
 * de la ventana base·2^(n-1), con tope en OUTBOX_MAX_RETRY_DELAY_MS.
 */
export function computeRetryDelayMs(retryNumber: number, random: () => number = Math.random): number {
  const exponent = Math.max(retryNumber, 1) - 1;
  const window = Math.min(OUTBOX_BASE_RETRY_DELAY_MS * 2 ** exponent, OUTBOX_MAX_RETRY_DELAY_MS);
  return Math.round(window / 2 + random() * (window / 2));
}

function parseRetryAfterMs(header: string | null, now: number): number | null {
  if (!header) return null;
  const value = header.trim();
  if (/^\d+$/.test(value)) return Number(value) * MS_PER_SECOND;
  const retryAt = Date.parse(value);
  return Number.isNaN(retryAt) ? null : Math.max(retryAt - now, 0);
}

type SendOutcome =
  | { kind: "sent" }
  | { kind: "offline" }
  | { kind: "throttled"; retryAfterMs: number | null }
  | { kind: "awaiting-session" }
  | { kind: "server-error"; status: number }
  | { kind: "rejected"; status: number };

function classifyResponse(response: Response, now: number): SendOutcome {
  if (response.ok) return { kind: "sent" };
  if (response.status === UNAUTHORIZED_STATUS) return { kind: "awaiting-session" };
  if (RETRYABLE_CLIENT_STATUSES.includes(response.status)) {
    return {
      kind: "throttled",
      retryAfterMs: parseRetryAfterMs(response.headers.get("Retry-After"), now),
    };
  }
  if (response.status >= SERVER_ERROR_MIN_STATUS) {
    return { kind: "server-error", status: response.status };
  }
  return { kind: "rejected", status: response.status };
}

type SentHandler = (entry: OutboxEntry, response: Response) => void | Promise<void>;

const sentHandlers = new Map<OutboxEndpoint, SentHandler>();

/**
 * Qué hacer con la respuesta de un envío exitoso (p. ej. el código final de
 * una cita). Devuelve la función para quitarlo.
 */
export function registerOutboxSentHandler(endpoint: OutboxEndpoint, handler: SentHandler): () => void {
  sentHandlers.set(endpoint, handler);
  return () => {
    if (sentHandlers.get(endpoint) === handler) sentHandlers.delete(endpoint);
  };
}

/** Un fallo del manejador no devuelve la entrada a la cola: el servidor ya la recibió. */
async function notifySent(entry: OutboxEntry, response: Response): Promise<void> {
  const handler = sentHandlers.get(entry.endpoint);
  if (!handler) return;
  try {
    await handler(entry, response);
  } catch (error) {
    console.error(`[outbox] ${entry.endpoint}: no se pudo procesar la respuesta`, error instanceof Error ? error.name : "error desconocido");
  }
}

async function sendEntry(entry: OutboxEntry, fetchImpl: typeof fetch, now: number): Promise<SendOutcome> {
  try {
    const response = await fetchImpl(entry.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry.body),
    });
    if (response.ok) await notifySent(entry, response);
    return classifyResponse(response, now);
  } catch (error) {
    const reason = error instanceof Error ? error.name : "error desconocido";
    console.warn(`[outbox] ${entry.endpoint} sin conexión (${reason}); se reintentará`);
    return { kind: "offline" };
  }
}

function toDeadLetter(entry: OutboxEntry, status: number, now: number): DeadLetterEntry {
  return {
    id: entry.id,
    endpoint: entry.endpoint,
    body: entry.body,
    containsPersonalData: entry.containsPersonalData,
    status,
    failedAt: now,
  };
}

function writeDeadLetters(entries: readonly DeadLetterEntry[], now: number): void {
  deadLetterStore.write(withoutExpired(entries, now).slice(-OUTBOX_DEAD_LETTER_LIMIT));
}

function moveToDeadLetters(entry: OutboxEntry, status: number, now: number): void {
  console.error(`[outbox] ${entry.endpoint} no se pudo enviar (HTTP ${status}); queda en la cola de errores`);
  writeDeadLetters([...deadLetterStore.getSnapshot(), toDeadLetter(entry, status, now)], now);
}

function rescheduled(entry: OutboxEntry, now: number, random: () => number, delayMs?: number): OutboxEntry {
  const retries = entry.retries + 1;
  const delay = Math.min(delayMs ?? computeRetryDelayMs(retries, random), OUTBOX_MAX_RETRY_DELAY_MS);
  return { ...entry, retries, nextAttemptAt: now + delay };
}

/** Devuelve la entrada actualizada, o null si sale de la cola (enviada o a la cola de errores). */
function nextEntryState(
  entry: OutboxEntry,
  outcome: SendOutcome,
  now: number,
  random: () => number
): OutboxEntry | null {
  switch (outcome.kind) {
    case "sent":
      return null;
    case "offline":
    case "awaiting-session":
      return rescheduled(entry, now, random);
    case "throttled":
      return rescheduled(entry, now, random, outcome.retryAfterMs ?? undefined);
    case "rejected":
      moveToDeadLetters(entry, outcome.status, now);
      return null;
    case "server-error": {
      const attempts = entry.attempts + 1;
      if (attempts >= OUTBOX_MAX_SERVER_FAILURES) {
        moveToDeadLetters(entry, outcome.status, now);
        return null;
      }
      return rescheduled({ ...entry, attempts }, now, random);
    }
  }
}

function applyOutcome(entryId: string, outcome: SendOutcome, now: number, random: () => number): void {
  const updated = outboxStore.getSnapshot().flatMap((entry): OutboxEntry[] => {
    if (entry.id !== entryId) return [entry];
    const next = nextEntryState(entry, outcome, now, random);
    return next ? [next] : [];
  });
  outboxStore.write(updated);
}

function dropInvalidEntries(): OutboxEntry[] {
  const snapshot: unknown[] = outboxStore.getSnapshot();
  const valid = parseOutboxEntries(snapshot) ?? [];
  if (valid.length !== snapshot.length) {
    console.error(`[outbox] ${snapshot.length - valid.length} entradas corruptas descartadas`);
    outboxStore.write(valid);
  }
  return valid;
}

function isNavigatorOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

interface FlushOptions {
  now?: number;
  fetchImpl?: typeof fetch;
  /** Fuente de aleatoriedad del jitter (inyectable en pruebas). */
  random?: () => number;
  /** Envía también lo que espera su backoff (p. ej. al recuperar la conexión). */
  ignoreBackoff?: boolean;
}

interface FlushRun {
  now: number;
  fetchImpl: typeof fetch;
  random: () => number;
  ignoreBackoff: boolean;
}

let inFlightFlush: Promise<void> | null = null;

async function runFlush({ now, fetchImpl, random, ignoreBackoff }: FlushRun): Promise<void> {
  const dueEntries = dropInvalidEntries().filter(
    (entry) => ignoreBackoff || entry.nextAttemptAt <= now
  );
  for (const entry of dueEntries) {
    // Sin conexión no se intenta nada: las entradas conservan intentos y horario.
    if (isNavigatorOffline()) return;
    const outcome = await sendEntry(entry, fetchImpl, now);
    applyOutcome(entry.id, outcome, now, random);
    if (outcome.kind === "offline") return;
  }
}

/** Envía las entradas vencidas. Llamadas simultáneas comparten el mismo vaciado. */
export function flushOutbox({
  now = Date.now(),
  fetchImpl = fetch,
  random = Math.random,
  ignoreBackoff = false,
}: FlushOptions = {}): Promise<void> {
  if (inFlightFlush) return inFlightFlush;

  inFlightFlush = runFlush({ now, fetchImpl, random, ignoreBackoff })
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

/** Elimina de la cola de errores lo que tenga más de 30 días. */
export function purgeExpiredDeadLetters(now = Date.now()): void {
  const current = deadLetterStore.getSnapshot();
  const kept = withoutExpired(current, now);
  if (kept.length !== current.length) deadLetterStore.write(kept);
}

/**
 * Vuelve a encolar una entrada de la cola de errores y la saca de ella.
 * Devuelve false si no existe o si ya no cumple el consentimiento requerido.
 */
export function retryDeadLetter(id: string, { now = Date.now() }: { now?: number } = {}): boolean {
  const deadLetter = deadLetterStore.getSnapshot().find((entry) => entry.id === id);
  if (!deadLetter) return false;

  const queued = enqueueOutboxRequest(deadLetter.endpoint, deadLetter.body, {
    containsPersonalData: deadLetter.containsPersonalData,
    now,
  });
  if (!queued) return false;

  writeDeadLetters(
    deadLetterStore.getSnapshot().filter((entry) => entry.id !== id),
    now
  );
  return true;
}
