"use client";

import { ArtikoMascot } from "@/components/mascot/ArtikoMascot";
import { GameButton } from "@/components/ui/GameButton";
import type { GameState } from "@/hooks/useGame";
import { markGameCelebrated, toggleAccessory } from "@/lib/gamification/progress";
import { GAME_UNLOCKS } from "@/lib/gamification/unlocks";
import { ACCESSORY_NAMES, ARTIKO_ACCESSORIES } from "@/lib/mascot/mascot";
import type { ShareMoment } from "@/lib/share/momentShare";
import { useState } from "react";
import { ShareMomentSheet } from "./ShareMomentSheet";

/** Aviso de desbloqueo nuevo (una vez): insignia o accesorio para Artiko. */
export function GameUnlockToast({ game }: { game: GameState }) {
  const [first] = game.pendingUnlocks;
  if (!first) return null;
  const { unlock } = first;
  const dismiss = () => markGameCelebrated(game.pendingUnlocks.map((item) => item.key));

  return (
    <section aria-label="¡Desbloqueaste algo nuevo!" className="flex items-center gap-3 rounded-2xl border-2 border-gold-deep bg-pastel-lemon px-4 py-4 text-pastel-lemon-ink">
      <span aria-hidden="true" className="text-5xl">{unlock.emoji}</span>
      <div className="flex flex-1 flex-col gap-2">
        <p role="status" className="text-xl font-black">¡Desbloqueaste: {unlock.title}!</p>
        <p className="text-base">{unlock.description}</p>
        <div className="flex flex-wrap gap-2">
          {unlock.accessory && !game.progress.equipped.includes(unlock.accessory) && (
            <GameButton
              tone="gold"
              size="md"
              onClick={() => {
                if (unlock.accessory) toggleAccessory(unlock.accessory, game.accessories);
                dismiss();
              }}
            >
              Ponérsela a Artiko
            </GameButton>
          )}
          <GameButton tone="surface" size="md" haptic={false} onClick={dismiss}>
            ¡Genial!
          </GameButton>
        </div>
      </div>
    </section>
  );
}

/** Vitrina: insignias de constancia y armario cosmético de Artiko (solo estético, sin compras). */
export function ArtikoShowcase({ game }: { game: GameState }) {
  const unlockedIds = new Set(game.progress.unlocked.map((item) => item.unlockId));
  const [moment, setMoment] = useState<ShareMoment | null>(null);
  return (
    <section aria-labelledby="vitrina-artiko" className="flex flex-col gap-4 rounded-card bg-surface px-4 py-5 shadow-soft">
      <h2 id="vitrina-artiko" className="text-2xl font-black text-clinic">
        Vitrina de Artiko <span aria-hidden="true">🏆</span>
      </h2>
      <div className="flex items-center gap-4">
        <ArtikoMascot emotion="happy" accessories={game.progress.equipped} size={110} />
        <div className="flex flex-1 flex-col gap-2" role="group" aria-label="Accesorios de Artiko">
          {ARTIKO_ACCESSORIES.map((accessory) => {
            const isUnlocked = game.accessories.includes(accessory);
            const isOn = game.progress.equipped.includes(accessory);
            return (
              <GameButton
                key={accessory}
                tone={isOn ? "gold" : "surface"}
                size="md"
                block
                aria-pressed={isOn}
                aria-disabled={!isUnlocked}
                aria-describedby={isUnlocked ? undefined : "accesorio-bloqueado"}
                onClick={() => toggleAccessory(accessory, game.accessories)}
              >
                {isUnlocked ? "" : "🔒 "}
                {ACCESSORY_NAMES[accessory]}
              </GameButton>
            );
          })}
          <p id="accesorio-bloqueado" className="text-sm text-muted">Los accesorios con candado se ganan con constancia.</p>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-2" aria-label="Insignias">
        {GAME_UNLOCKS.map((unlock) => {
          const isUnlocked = unlockedIds.has(unlock.id);
          return (
            <li key={unlock.id} className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-center ${isUnlocked ? "bg-pastel-lemon text-pastel-lemon-ink" : "bg-canvas text-muted"}`}>
              <span aria-hidden="true" className={`text-4xl ${isUnlocked ? "" : "grayscale opacity-50"}`}>{unlock.emoji}</span>
              <span className="text-base font-black">{unlock.title}</span>
              <span className="text-sm">{isUnlocked ? "¡Conseguida!" : "Por conseguir"}</span>
              {isUnlocked && unlock.shareable && (
                <button
                  type="button"
                  onClick={() => setMoment({ kind: "badge", unlockId: unlock.id })}
                  aria-label={`Compartir la insignia ${unlock.title}`}
                  className="min-h-12 rounded-xl px-3 font-bold underline"
                >
                  Compartir
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {moment && <ShareMomentSheet moment={moment} onClose={() => setMoment(null)} />}
    </section>
  );
}
