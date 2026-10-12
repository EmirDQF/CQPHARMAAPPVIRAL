"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isNativeApp } from "@/lib/native/doseNotifications";

/** Marca de la sesión del WebView: solo el primer arranque salta a la app. */
const LAUNCHED_KEY = "artikare_native_launched";

/** true la primera vez en esta sesión del WebView. */
function claimFirstLaunch(): boolean {
  try {
    if (window.sessionStorage.getItem(LAUNCHED_KEY)) return false;
    window.sessionStorage.setItem(LAUNCHED_KEY, "1");
  } catch {
    // Sin sessionStorage: se redirige igual; a lo sumo una vez más tras recargar.
  }
  return true;
}

/**
 * En la app Android la interfaz arranca en "/" (la landing web). Al abrir la
 * app se va directo a /app: Artiko y el registro (consentimiento y datos) en el
 * primer uso, "Hoy" después. Un enlace con query (p. ej. una invitación al
 * test) se respeta, y volver a "/" más tarde, desde la app, también.
 */
export function NativeLaunchRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isNativeApp() || pathname !== "/" || window.location.search) return;
    if (claimFirstLaunch()) router.replace("/app");
  }, [pathname, router]);

  return null;
}
