"use client";

import { useEffect } from "react";
import { ArtikoMascot } from "@/components/mascot/ArtikoMascot";
import { GameButton } from "@/components/ui/GameButton";
import { MASCOT } from "@/lib/mascot/mascot";
import { StepHeading } from "./StepHeading";

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
      className="flex min-h-dvh w-full flex-col items-center justify-center gap-6 bg-vital px-6 text-vital-ink"
    >
      <span className="flex size-64 items-center justify-center rounded-full bg-white shadow-soft">
        <ArtikoMascot emotion="welcome" size={200} decorative />
      </span>
      <span className="text-5xl font-black tracking-tight">Artikare</span>
      <span className="text-lg font-bold">Toca para continuar</span>
    </button>
  );
}

interface WelcomeScreen {
  title: string;
  body: string;
  cta: string;
}

const WELCOME_SCREENS: readonly WelcomeScreen[] = [
  {
    title: `¡Hola! Soy ${MASCOT.name} 👋`,
    body: "Te acompaño cada día con misiones cortitas para cuidar tus huesos y articulaciones. Sin presión.",
    cta: "¡Vamos! 🎉",
  },
  {
    title: "Pequeños pasos, todos los días 🔥",
    body: "Registra cómo amaneces, tus tomas y actividades suaves. Sumas puntos y racha. Si un día no puedes, no pasa nada: tienes días de gracia.",
    cta: "¡Me gusta! 💪",
  },
];

export const WELCOME_SCREEN_COUNT = WELCOME_SCREENS.length;

export function WelcomeStep({ index, onNext }: { index: number; onNext: () => void }) {
  const screen = WELCOME_SCREENS[index];
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <ArtikoMascot emotion={index === 0 ? "welcome" : "fire_streak"} size={180} decorative />
      <StepHeading>{screen.title}</StepHeading>
      <p className="text-xl">{screen.body}</p>
      <p className="text-base text-muted">
        {MASCOT.name} acompaña y recuerda; no da diagnósticos ni reemplaza a tu médico.
      </p>
      <GameButton tone="vital" size="xl" block onClick={onNext}>
        {screen.cta}
      </GameButton>
    </div>
  );
}
