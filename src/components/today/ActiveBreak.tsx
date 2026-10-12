"use client";

import { useState, useSyncExternalStore } from "react";
import { ArtikoMascot } from "@/components/mascot/ArtikoMascot";
import { GameButton } from "@/components/ui/GameButton";
import { useActiveBreak } from "@/hooks/useActiveBreak";
import type { Activity } from "@/lib/activities/schemas";
import { smartRemindersStore } from "@/lib/reminders/smart/settings";
import { GuidedActivitySheet } from "./GuidedActivitySheet";

/** Pausa de 1 minuto sentado: respiración y mirada lejos de la pantalla (sin esfuerzo físico). */
const BREAK_ACTIVITY: Activity = {
  id: "pausa-activa",
  emoji: "🧘",
  title: "Pausa de 1 minuto",
  description: "Respira y descansa la vista.",
  category: "habitos",
  kind: "guided",
  durationMinutes: 1,
  xp: 1,
  safety: "none",
  requiresClearance: false,
  core: false,
  steps: [
    { text: "Sentado y cómodo, inhala por la nariz contando hasta 4 y suelta el aire contando hasta 6.", seconds: 30 },
    { text: "Mira algo lejano por la ventana y parpadea suave.", seconds: 30 },
  ],
};

/** Tras ~10 min seguidos en la app, Artiko propone una pausa. Opt-in en Ajustes; "Ahora no" siempre visible. */
export function ActiveBreak() {
  const settings = useSyncExternalStore(smartRemindersStore.subscribe, smartRemindersStore.getSnapshot, smartRemindersStore.getServerSnapshot);
  const { isDue, reset } = useActiveBreak(settings.activeBreaks);
  const [isOpen, setIsOpen] = useState(false);

  if (isOpen) {
    const close = () => {
      setIsOpen(false);
      reset();
    };
    return <GuidedActivitySheet activity={BREAK_ACTIVITY} onComplete={close} onClose={close} />;
  }
  if (!isDue) return null;

  return (
    <section
      aria-label="Pausa activa"
      className="fixed inset-x-3 bottom-20 z-40 mx-auto flex max-w-xl items-center gap-3 rounded-2xl border-2 border-sky-deep bg-surface px-4 py-3 shadow-soft"
    >
      <ArtikoMascot emotion="heads_up" size={64} decorative />
      <div className="flex flex-1 flex-col gap-2">
        <p role="status" className="text-lg font-black">¿Una pausa de 1 minuto? 🧘</p>
        <div className="flex flex-wrap gap-2">
          <GameButton tone="sky" size="md" onClick={() => setIsOpen(true)}>
            ¡Vamos!
          </GameButton>
          <GameButton tone="surface" size="md" haptic={false} onClick={reset}>
            Ahora no
          </GameButton>
        </div>
      </div>
    </section>
  );
}
