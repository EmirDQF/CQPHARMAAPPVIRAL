"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Si el registro falla, la app sigue funcionando en modo online; se reporta para diagnóstico.
    navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      console.error("[pwa] No se pudo registrar el service worker", error);
    });
  }, []);

  return null;
}
