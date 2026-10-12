"use client";

import { ArtikoMascot } from "@/components/mascot/ArtikoMascot";
import { GameButton } from "@/components/ui/GameButton";
import type { NudgeMessage } from "@/lib/reminders/smart/messages";

/** Artiko avisa dentro de la app (p. ej. al conectarse a Wi-Fi), sin notificación del sistema. */
export function InAppNudge({ message, onDismiss }: { message: NudgeMessage; onDismiss: () => void }) {
  return (
    <section aria-label="Aviso de Artiko" className="flex items-center gap-3 rounded-2xl border-2 border-sky-deep bg-pastel-sky px-4 py-3 text-pastel-sky-ink">
      <ArtikoMascot emotion="heads_up" size={64} decorative />
      <p role="status" className="flex-1 text-lg font-bold">
        {message.body}
      </p>
      <GameButton tone="surface" size="md" haptic={false} onClick={onDismiss}>
        Ok
      </GameButton>
    </section>
  );
}
