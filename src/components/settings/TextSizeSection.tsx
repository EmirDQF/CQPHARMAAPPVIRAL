"use client";

import { useSyncExternalStore } from "react";
import { GameButton } from "@/components/ui/GameButton";
import { TEXT_SIZES, TEXT_SIZE_LABELS, setTextSize, textSizeStore, type TextSize } from "@/lib/display/textSize";
import { SettingsCard } from "./SettingsCard";

const SAMPLE_CLASS: Record<TextSize, string> = { normal: "text-base", large: "text-xl", xlarge: "text-3xl" };

/** Tres botones grandes con una "Aa" de muestra; el cambio se aplica al instante en toda la app. */
export function TextSizeSection() {
  const { size } = useSyncExternalStore(textSizeStore.subscribe, textSizeStore.getSnapshot, textSizeStore.getServerSnapshot);
  return (
    <SettingsCard
      id="text-size-heading"
      title="Tamaño de letra"
      description="Elige el tamaño que leas con más comodidad. Se aplica en toda la app y se guarda en tu celular."
    >
      <div role="group" aria-labelledby="text-size-heading" className="grid grid-cols-3 gap-2">
        {TEXT_SIZES.map((option) => (
          <GameButton
            key={option}
            type="button"
            tone={size === option ? "vital" : "surface"}
            size="md"
            aria-pressed={size === option}
            onClick={() => setTextSize(option)}
            className="flex-col gap-0 py-2"
          >
            <span aria-hidden="true" className={`font-black ${SAMPLE_CLASS[option]}`}>Aa</span>
            <span className="text-sm">{TEXT_SIZE_LABELS[option]}</span>
          </GameButton>
        ))}
      </div>
    </SettingsCard>
  );
}
