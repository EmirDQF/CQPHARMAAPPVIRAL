"use client";

import { useSyncExternalStore } from "react";
import {
  deadLetterStore,
  flushOutbox,
  outboxStore,
  retryDeadLetter,
  type DeadLetterEntry,
  type OutboxEndpoint,
} from "@/lib/api/outbox";

const ENDPOINT_LABELS: Record<OutboxEndpoint, string> = {
  "/api/appointments": "Reserva de cita",
  "/api/leads": "Resultado del test",
};

const FAILED_AT_FORMATTER = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  day: "numeric",
  month: "short",
});

function subscribeToConnection(listener: () => void): () => void {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
}

function useIsOnline(): boolean {
  return useSyncExternalStore(
    subscribeToConnection,
    () => navigator.onLine,
    () => true
  );
}

function pendingLabel(count: number): string {
  return count === 1 ? "1 pendiente de enviar" : `${count} pendientes de enviar`;
}

function statusMessage(pendingCount: number, isOnline: boolean): string | null {
  if (!isOnline) {
    return pendingCount > 0
      ? `Sin conexión · ${pendingLabel(pendingCount)}. Se enviarán solos al volver la señal.`
      : "Sin conexión. Puedes seguir usando la app.";
  }
  return pendingCount > 0 ? pendingLabel(pendingCount) : null;
}

function handleRetry(id: string): void {
  if (retryDeadLetter(id)) void flushOutbox({ ignoreBackoff: true });
}

function DeadLetterList({ entries }: { entries: readonly DeadLetterEntry[] }) {
  const summary = entries.length === 1 ? "1 registro" : `${entries.length} registros`;

  return (
    <section className="flex flex-col gap-2" aria-label="Envíos por revisar">
      <p>
        No pudimos enviar {summary}. Sigue guardado en este equipo y puedes intentarlo de nuevo.
      </p>
      <ul className="flex flex-col gap-2">
        {entries.map((entry) => {
          const label = ENDPOINT_LABELS[entry.endpoint];
          const date = FAILED_AT_FORMATTER.format(entry.failedAt);
          return (
            <li key={entry.id} className="flex items-center justify-between gap-3">
              <span>
                {label} · {date}
              </span>
              <button
                type="button"
                onClick={() => handleRetry(entry.id)}
                aria-label={`Reintentar envío: ${label} del ${date}`}
                className="min-h-12 min-w-12 rounded-xl border-2 border-brand px-4 font-semibold text-brand-dark hover:bg-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Reintentar
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Indicador sutil del estado de la cola de envíos: cuántos datos esperan
 * salir, si no hay conexión y qué envíos necesitan un reintento manual.
 * No muestra nada cuando todo está al día.
 */
export function OutboxStatus() {
  const pending = useSyncExternalStore(
    outboxStore.subscribe,
    outboxStore.getSnapshot,
    outboxStore.getServerSnapshot
  );
  const deadLetters = useSyncExternalStore(
    deadLetterStore.subscribe,
    deadLetterStore.getSnapshot,
    deadLetterStore.getServerSnapshot
  );
  const isOnline = useIsOnline();
  const message = statusMessage(pending.length, isOnline);
  const hasContent = message !== null || deadLetters.length > 0;

  return (
    <div
      className={
        hasContent
          ? "flex flex-col gap-3 rounded-2xl border border-foreground/10 bg-background px-4 py-3 text-base text-foreground/80"
          : undefined
      }
    >
      <div role="status" aria-live="polite">
        {message && <p>{message}</p>}
      </div>
      {deadLetters.length > 0 && <DeadLetterList entries={deadLetters} />}
    </div>
  );
}
