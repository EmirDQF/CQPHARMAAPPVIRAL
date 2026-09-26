"use client";

import { useSyncExternalStore } from "react";
import type { AuthStatus } from "@/lib/auth/types";
import { authStatusStore } from "@/lib/supabase/browserAuth";

/** Estado de sesión para la UI: "unconfigured" sin Supabase, luego guest/anonymous/account. */
export function useAuthStatus(): AuthStatus {
  return useSyncExternalStore(
    authStatusStore.subscribe,
    authStatusStore.getSnapshot,
    authStatusStore.getServerSnapshot
  );
}
