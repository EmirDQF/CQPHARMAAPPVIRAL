"use client";

import { useId } from "react";
import { ArtikoMascot } from "@/components/mascot/ArtikoMascot";
import { GameButton } from "@/components/ui/GameButton";
import { ModalDialog } from "@/components/ui/ModalDialog";
import type { LearningReward } from "@/hooks/useLearningReward";

interface LearningRewardModalProps {
  reward: LearningReward;
  onClose: () => void;
}

const WARM_MESSAGE = "Estar pendiente de tu salud es un acto de cariño contigo y con los tuyos. ¡Bien hecho!";

function capMessage({ awardedXp, capReached }: LearningReward): string | null {
  if (awardedXp > 0 && capReached) return "Llegaste al XP de aprendizaje de hoy. Puedes seguir aprendiendo por gusto; mañana se suma de nuevo.";
  if (awardedXp > 0) return null;
  if (capReached) return "Hoy ya sumaste todo el XP de aprendizaje. Repasar también es cuidarte; mañana se suma de nuevo.";
  return "Esta ya sumó hoy. Repasar también es cuidarte.";
}

/** Recompensa sin presión: XP del día (con tope), Artiko celebrando y un mensaje cálido. */
export function LearningRewardModal({ reward, onClose }: LearningRewardModalProps) {
  const titleId = useId();
  const note = capMessage(reward);
  return (
    <ModalDialog labelledBy={titleId} onClose={onClose}>
      <div className="flex flex-col items-center gap-4 text-center">
        <ArtikoMascot emotion="celebrating" size={128} decorative />
        <h2 id={titleId} className="text-2xl font-black text-clinic">
          ¡Completaste {reward.title}!
        </h2>
        {reward.awardedXp > 0 && (
          <p className="xp-pop rounded-full border-2 border-xp-deep bg-xp px-5 py-2 text-2xl font-black text-xp-ink">
            +{reward.awardedXp} XP
          </p>
        )}
        {reward.unlocked.length > 0 && (
          <ul aria-label="Insignias nuevas" className="flex w-full flex-col gap-2">
            {reward.unlocked.map((unlock) => (
              <li key={unlock.id} className="animate-fade-in flex items-center gap-3 rounded-control border-2 border-gold-deep bg-gold px-4 py-3 text-left text-gold-ink">
                <span aria-hidden="true" className="text-3xl">
                  {unlock.emoji}
                </span>
                <span className="flex flex-col">
                  <span className="text-lg font-black">Nueva insignia: {unlock.title}</span>
                  <span className="text-base">{unlock.description}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-lg">{WARM_MESSAGE}</p>
        {note && <p className="rounded-control bg-pastel-sky px-4 py-3 text-lg text-pastel-sky-ink">{note}</p>}
        <GameButton tone="vital" block onClick={onClose}>
          Seguir
        </GameButton>
      </div>
    </ModalDialog>
  );
}
