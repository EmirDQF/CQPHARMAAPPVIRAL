"use client";

import { useEffect } from "react";
import { ArtikoMascot } from "@/components/mascot/ArtikoMascot";
import { GameButton } from "@/components/ui/GameButton";
import { MASCOT } from "@/lib/mascot/mascot";
import { ArtikoSays } from "./ArtikoSays";

/** El splash dura como máximo esto y se salta con un toque. */
export const SPLASH_DURATION_MS = 1500;

export function SplashStep({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label="Artikare. Toca para continuar"
      className="flex min-h-dvh w-full flex-col items-center justify-center gap-6 bg-pastel-mint px-6 text-pastel-mint-ink"
    >
      <span className="flex size-64 items-center justify-center rounded-full bg-surface shadow-soft">
        <ArtikoMascot emotion="welcome" size={200} decorative />
      </span>
      <span className="text-5xl font-black tracking-tight">Artikare</span>
      <span className="text-lg font-bold">Toca para continuar</span>
    </button>
  );
}

/** Única bienvenida: un toque y la persona ya está en el consentimiento (≤ 2 toques hasta el formulario). */
export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <ArtikoSays emotion="welcome">Hola, soy {MASCOT.name}, cuéntame de ti</ArtikoSays>
      <p className="text-xl">
        Te hago unas preguntas cortas, una por pantalla, y te acompaño cada día con tus tomas y tu diario.
      </p>
      <p className="text-lg text-muted">
        {MASCOT.name} acompaña y recuerda; no da diagnósticos ni reemplaza a tu médico.
      </p>
      <GameButton tone="vital" size="xl" block onClick={onNext}>
        Empezar
      </GameButton>
    </div>
  );
}
