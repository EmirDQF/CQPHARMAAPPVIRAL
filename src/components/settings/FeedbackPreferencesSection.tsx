"use client";

import { useSyncExternalStore } from "react";
import {
  feedbackPreferencesStore,
  updateFeedbackPreferences,
  type FeedbackPreferences,
} from "@/lib/feedback/preferences";
import { SettingsCard } from "./SettingsCard";

type ToggleKey = "haptics" | "sound" | "celebrations";

const TOGGLES: readonly { key: ToggleKey; label: string; hint: string }[] = [
  { key: "haptics", label: "Vibración al tocar", hint: "Un pulso corto confirma cada toque." },
  { key: "sound", label: "Sonidos", hint: "Tonos cortos al tomar tu suplemento, completar misiones y lograr tu meta." },
  { key: "celebrations", label: "Confeti y celebraciones", hint: "Animaciones al completar tus misiones." },
];

/** Interruptores accesibles (role="switch"): el cambio se guarda al instante, sin botón "Guardar". */
export function FeedbackPreferencesSection() {
  const preferences: FeedbackPreferences = useSyncExternalStore(
    feedbackPreferencesStore.subscribe,
    feedbackPreferencesStore.getSnapshot,
    feedbackPreferencesStore.getServerSnapshot
  );

  return (
    <SettingsCard
      id="feedback-preferences-heading"
      title="Vibración, sonidos y celebraciones"
      description="Los sonidos son tonos propios de Artikare y siguen el volumen de tu celular. Si prefieres menos movimiento, tu celular también puede pedirlo y lo respetamos."
    >
      {TOGGLES.map(({ key, label, hint }) => (
        <label key={key} className="flex min-h-12 items-center justify-between gap-4 cursor-pointer">
          <span className="flex flex-col">
            <span className="text-lg font-bold">{label}</span>
            <span className="text-base text-muted">{hint}</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={preferences[key]}
            onChange={(event) => updateFeedbackPreferences({ [key]: event.target.checked })}
            className="h-7 w-12 shrink-0 cursor-pointer accent-vital-deep"
          />
        </label>
      ))}
    </SettingsCard>
  );
}
