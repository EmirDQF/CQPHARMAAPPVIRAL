"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { pendingAssessmentStore, uploadPendingAssessment } from "@/lib/api/pendingAssessment";

/**
 * Sube el último resultado del test en cuanto hay sesión (anónima o cuenta),
 * nunca la crea por su cuenta (C4: el test no genera usuarios).
 */
export function PendingAssessmentUploader() {
  const authStatus = useAuthStatus();
  const pending = useSyncExternalStore(
    pendingAssessmentStore.subscribe,
    pendingAssessmentStore.getSnapshot,
    pendingAssessmentStore.getServerSnapshot
  );
  const hasSession = authStatus === "anonymous" || authStatus === "account";

  useEffect(() => {
    if (hasSession && pending.assessment) uploadPendingAssessment();
  }, [hasSession, pending.assessment]);

  return null;
}
