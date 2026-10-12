"use client";

import { useEffect } from "react";
import { isNativeApp } from "@/lib/native/doseNotifications";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // En la app Android la interfaz ya viaja dentro del APK: un service worker solo añadiría una caché que envejece.
    if (isNativeApp() || !("serviceWorker" in navigator)) return;

    // Si el registro falla, la app sigue funcionando en modo online; se reporta para diagnóstico.
    // updateViaCache "none": el navegador siempre revalida sw.js contra la red,
    // así una versión nueva de la política de caché llega sin esperar al caché HTTP.
    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch((error: unknown) => {
      console.error("[pwa] No se pudo registrar el service worker", error);
    });
  }, []);

  return null;
}
