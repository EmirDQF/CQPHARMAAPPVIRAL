"use client";

import { useEffect } from "react";
import { flushOutbox } from "@/lib/api/outbox";

/** Vacía la cola de envíos pendientes al abrir la app y al recuperar conexión. */
export function OutboxSync() {
  useEffect(() => {
    const flush = () => void flushOutbox();
    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, []);

  return null;
}
