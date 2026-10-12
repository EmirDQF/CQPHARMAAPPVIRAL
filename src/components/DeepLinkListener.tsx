"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { readSiteUrl } from "@/lib/native/appIdentity";
import { resolveDeepLink, toInAppRoute } from "@/lib/native/deepLinks";
import { isNativeApp } from "@/lib/native/doseNotifications";

/**
 * Ruta del enlace de arranque ya abierta en esta sesión del WebView (sobrevive
 * a recargas). Se guarda la ruta saneada, nunca la URL cruda con su query.
 */
const HANDLED_LAUNCH_PATH_KEY = "artikare_handled_launch_path";

/** true la primera vez que se abre esta ruta de arranque en la sesión. */
function claimLaunchPath(path: string): boolean {
  try {
    if (window.sessionStorage.getItem(HANDLED_LAUNCH_PATH_KEY) === path) return false;
    window.sessionStorage.setItem(HANDLED_LAUNCH_PATH_KEY, path);
  } catch {
    // Sin sessionStorage: se abre igual; a lo sumo se repite tras una recarga.
  }
  return true;
}

/**
 * En la app nativa, un enlace (App Link o `artikare://`, p. ej. una invitación
 * al test) llega de dos formas: con la app en memoria, por `appUrlOpen`; en
 * arranque en frío, Android no emite ese evento y el WebView carga el inicio,
 * así que se lee `getLaunchUrl()`. Solo se navega a rutas compartibles
 * (resolveDeepLink); cualquier otro enlace se ignora.
 */
export function DeepLinkListener() {
  const router = useRouter();

  useEffect(() => {
    if (!isNativeApp()) return;
    let removeListener: (() => Promise<void>) | null = null;
    let isUnmounted = false;

    const resolve = (url: string) => {
      const path = resolveDeepLink(url, readSiteUrl());
      return path === null ? null : toInAppRoute(path);
    };

    void import("@capacitor/app")
      .then(async ({ App }) => {
        const handle = await App.addListener("appUrlOpen", ({ url }) => {
          const path = resolve(url);
          if (path) router.push(path);
        });
        removeListener = () => handle.remove();
        if (isUnmounted) {
          void removeListener();
          return;
        }

        const launch = await App.getLaunchUrl();
        const launchPath = launch?.url ? resolve(launch.url) : null;
        if (!isUnmounted && launchPath && claimLaunchPath(launchPath)) router.push(launchPath);
      })
      .catch((error: unknown) => {
        console.error("[deep-links] No se pudo escuchar los enlaces de la app", error);
      });

    return () => {
      isUnmounted = true;
      if (removeListener) void removeListener();
    };
  }, [router]);

  return null;
}
