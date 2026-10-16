"use client";

import { useState } from "react";
import { triggerHaptic } from "@/lib/feedback/haptics";
import { playSound } from "@/lib/feedback/sounds";
import { recordLearning, type LearningKind } from "@/lib/gamification/learning";
import { toLimaIsoDate } from "@/lib/utils/date";

export interface LearningReward {
  title: string;
  awardedXp: number;
  capReached: boolean;
}

/**
 * Completar una lección o un juego: guarda (una vez por día), suena y vibra
 * desde el toque de la persona y deja listo el modal de recompensa.
 */
export function useLearningReward() {
  const [reward, setReward] = useState<LearningReward | null>(null);

  function complete(kind: LearningKind, id: string, title: string): LearningReward {
    const result = recordLearning(kind, id, toLimaIsoDate());
    playSound(result.awardedXp > 0 ? "fanfare" : "success");
    void triggerHaptic("success");
    const next = { title, ...result };
    setReward(next);
    return next;
  }

  return { reward, complete, dismiss: () => setReward(null) };
}
