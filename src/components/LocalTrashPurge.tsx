"use client";

import { useEffect } from "react";
import { purgeExpiredTrash } from "@/lib/storage/trash";

/**
 * Papelera local (modo invitado): borra de verdad lo vencido al abrir la app
 * y al volver a ella (la app nativa puede seguir en memoria varios días).
 */
export function LocalTrashPurge() {
  useEffect(() => {
    const purge = () => {
      purgeExpiredTrash(new Date());
    };
    const purgeWhenVisible = () => {
      if (document.visibilityState === "visible") purge();
    };

    purge();
    document.addEventListener("visibilitychange", purgeWhenVisible);
    return () => document.removeEventListener("visibilitychange", purgeWhenVisible);
  }, []);

  return null;
}
