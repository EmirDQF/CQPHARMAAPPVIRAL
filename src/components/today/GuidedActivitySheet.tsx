"use client";

import { useEffect, useState } from "react";
import { ArtikoMascot } from "@/components/mascot/ArtikoMascot";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { GameButton } from "@/components/ui/GameButton";
import { PHYSICAL_ACTIVITY_DISCLAIMER } from "@/lib/activities/catalog";
import type { Activity } from "@/lib/activities/schemas";

const TICK_MS = 1000;
const SECONDS_PER_MINUTE = 60;

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = String(totalSeconds % SECONDS_PER_MINUTE).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

/** Cuenta regresiva del paso actual; al llegar a 0 pasa al siguiente sola. */
function useStepCountdown(activity: Activity, isRunning: boolean) {
  const steps = activity.steps ?? [];
  const [stepIndex, setStepIndex] = useState(0);
  const [remaining, setRemaining] = useState(steps[0]?.seconds ?? 0);
  const isLastStep = stepIndex >= steps.length - 1;
  const isFinished = isLastStep && remaining === 0;

  useEffect(() => {
    if (!isRunning || isFinished) return;
    const timer = setInterval(() => setRemaining((value) => Math.max(0, value - 1)), TICK_MS);
    return () => clearInterval(timer);
  }, [isRunning, isFinished]);

  const goNext = () => {
    if (isLastStep) {
      setRemaining(0);
      return;
    }
    setStepIndex(stepIndex + 1);
    setRemaining(steps[stepIndex + 1].seconds);
  };

  if (remaining === 0 && !isLastStep) goNext();
  return { step: steps[stepIndex], stepIndex, stepCount: steps.length, remaining, isFinished, goNext };
}

interface GuidedActivitySheetProps {
  activity: Activity;
  onComplete: () => void;
  onClose: () => void;
}

/** Actividad física guiada por Artiko: descargo primero, pasos con cuenta regresiva y "Terminé" siempre disponible. */
export function GuidedActivitySheet({ activity, onComplete, onClose }: GuidedActivitySheetProps) {
  const [isRunning, setIsRunning] = useState(false);
  const { step, stepIndex, stepCount, remaining, isFinished, goNext } = useStepCountdown(activity, isRunning);

  return (
    <BottomSheet title={`${activity.emoji} ${activity.title}`} onClose={onClose}>
      <p role="note" className="rounded-2xl bg-pastel-peach px-4 py-3 text-lg font-bold text-pastel-peach-ink">
        <span aria-hidden="true">⚠️ </span>
        {PHYSICAL_ACTIVITY_DISCLAIMER}
      </p>
      <div className="flex items-center gap-3">
        <ArtikoMascot emotion={isFinished ? "celebrating" : "flexing"} size={88} decorative />
        <div className="flex-1">
          <p className="text-base font-bold text-muted">
            Paso {stepIndex + 1} de {stepCount}
          </p>
          <p className="text-xl font-bold">{isFinished ? "¡Lo hiciste! Respira con calma. 🎉" : step?.text}</p>
        </div>
      </div>
      <p aria-live="off" className="text-center text-6xl font-black tabular-nums text-clinic">
        {formatClock(remaining)}
      </p>
      <p className="sr-only" aria-live="polite">
        {isFinished ? "Actividad terminada" : `Paso ${stepIndex + 1}: ${step?.text}`}
      </p>
      <div className="flex flex-col gap-3">
        {!isFinished && (
          <GameButton tone="sky" block onClick={() => setIsRunning((running) => !running)}>
            {isRunning ? "⏸️ Pausar" : "▶️ Empezar"}
          </GameButton>
        )}
        {!isFinished && stepIndex < stepCount - 1 && (
          <GameButton tone="surface" size="md" block haptic={false} onClick={goNext}>
            Siguiente paso
          </GameButton>
        )}
        <GameButton tone="vital" block haptic="success" onClick={onComplete}>
          Terminé ✅
        </GameButton>
      </div>
    </BottomSheet>
  );
}
