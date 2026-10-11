"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { readSiteUrl } from "@/lib/native/appIdentity";
import { resolveDeepLink } from "@/lib/native/deepLinks";
import { isNativeApp } from "@/lib/native/doseNotifications";

/**
 * En la app nativa, un App Link (p. ej. una invitación al test) llega por
 * `appUrlOpen`. Solo se navega a rutas compartibles del propio dominio
 * (resolveDeepLink); cualquier otro enlace se ignora.
 */
export function DeepLinkListener() {
  const router = useRouter();

  useEffect(() => {
    if (!isNativeApp()) return;
    let removeListener: (() => Promise<void>) | null = null;
    let isUnmounted = false;

    void import("@capacitor/app")
      .then(({ App }) =>
        App.addListener("appUrlOpen", ({ url }) => {
          const path = resolveDeepLink(url, readSiteUrl());
          if (path) router.push(path);
        })
      )
      .then((handle) => {
        removeListener = () => handle.remove();
        if (isUnmounted) void removeListener();
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
