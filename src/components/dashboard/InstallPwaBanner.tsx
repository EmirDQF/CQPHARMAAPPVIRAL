"use client";

import { Smartphone } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  dismissPwaInstallPrompt,
  pwaInstallDismissedStore,
} from "@/lib/storage/pwaInstallDismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPwaBanner() {
  const isDismissed = useSyncExternalStore(
    pwaInstallDismissedStore.subscribe,
    pwaInstallDismissedStore.getSnapshot,
    pwaInstallDismissedStore.getServerSnapshot
  );
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  if (isDismissed || !installEvent) return null;

  async function handleInstall() {
    if (!installEvent) return;
    await installEvent.prompt();
    setInstallEvent(null);
  }

  return (
    <div className="rounded-card border-2 border-pastel-mint-edge bg-pastel-mint text-pastel-mint-ink px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <p className="flex items-start gap-2 text-lg font-medium">
        <Smartphone aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        Instala Artikare en tu pantalla de inicio para no perder tus recordatorios médicos.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleInstall}
          className="min-h-12 rounded-xl bg-surface text-pastel-mint-ink font-semibold px-4"
        >
          Instalar
        </button>
        <button
          type="button"
          onClick={dismissPwaInstallPrompt}
          aria-label="Ahora no, no instalar la app"
          className="min-h-12 rounded-xl border border-white/60 text-white font-semibold px-4"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
