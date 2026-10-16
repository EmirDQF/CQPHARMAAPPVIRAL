"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useSyncExternalStore } from "react";
import { feedbackPreferencesStore, updateFeedbackPreferences } from "@/lib/feedback/preferences";
import { playSound } from "@/lib/feedback/sounds";

/** Silencio rápido en la cabecera; es el mismo interruptor "Sonidos" de Ajustes. */
export function SoundToggle({ className = "" }: { className?: string }) {
  const { sound } = useSyncExternalStore(
    feedbackPreferencesStore.subscribe,
    feedbackPreferencesStore.getSnapshot,
    feedbackPreferencesStore.getServerSnapshot
  );
  const Icon = sound ? Volume2 : VolumeX;

  function toggle() {
    updateFeedbackPreferences({ sound: !sound });
    // Al encender, un toque confirma que ya suena (sale de un gesto de la persona).
    if (!sound) playSound("tap");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Sonidos"
      aria-pressed={sound}
      title={sound ? "Sonidos encendidos" : "Sonidos apagados"}
      className={`min-h-12 min-w-12 flex items-center justify-center rounded-full bg-pastel-mint text-pastel-mint-ink border-2 border-pastel-mint-edge transition-transform active:scale-95 ${className}`}
    >
      <Icon aria-hidden="true" className="size-5" />
    </button>
  );
}
