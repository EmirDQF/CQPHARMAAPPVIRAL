"use client";

import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { ArtikoMascot } from "@/components/mascot/ArtikoMascot";
import type { ArtikoEmotion } from "@/lib/mascot/mascot";

interface GameFrameProps {
  title: string;
  step: number;
  total: number;
  emotion: ArtikoEmotion;
  onExit: () => void;
  children: ReactNode;
}

/** Marco común: volver, título, avance (sin reloj) y Artiko reaccionando. */
export function GameFrame({ title, step, total, emotion, onExit, children }: GameFrameProps) {
  const percent = total <= 0 ? 0 : Math.round((Math.min(step, total) / total) * 100);
  return (
    <section aria-labelledby="juego-titulo" className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onExit}
          aria-label="Salir del juego"
          className="min-h-12 min-w-12 flex items-center justify-center rounded-full bg-pastel-sky text-pastel-sky-ink"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </button>
        <h1 id="juego-titulo" className="flex-1 text-2xl font-black text-clinic">
          {title}
        </h1>
        <ArtikoMascot emotion={emotion} size={64} decorative />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-lg font-bold">
          {Math.min(step, total)} de {total}
        </p>
        <div role="progressbar" aria-label="Avance del juego" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.min(step, total)} className="h-3 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-xp-deep transition-[width] duration-500 ease-out" style={{ width: `${percent}%` }} />
        </div>
      </div>
      {children}
    </section>
  );
}
