"use client";

import type { CelebratedReward } from "@/hooks/useRewards";
import { RewardIllustration } from "./RewardIllustration";
import { TONE_CARD_CLASS } from "./toneClasses";

const CONFETTI_COLORS = ["mint", "sky", "lavender", "peach", "rose", "lemon"] as const;
const CONFETTI_STAGGER_MS = 90;
const CONFETTI_SPACING_PERCENT = 15;
const CONFETTI_OFFSET_PERCENT = 8;

interface RewardCelebrationProps {
  celebrations: CelebratedReward[];
  onDismiss: () => void;
  onOpenAchievements: () => void;
}

/** Celebración corta y sobria: confeti suave (sin sonido) y un mensaje de constancia. */
export function RewardCelebration({ celebrations, onDismiss, onOpenAchievements }: RewardCelebrationProps) {
  const [first] = celebrations;
  if (!first) return null;
  const extra = celebrations.length - 1;
  return (
    <section
      aria-labelledby="nuevo-logro"
      className={`relative overflow-hidden rounded-card px-5 py-5 flex flex-col gap-3 ${TONE_CARD_CLASS[first.reward.tone]}`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-10">
        {CONFETTI_COLORS.map((tone, index) => (
          <span
            key={tone}
            className="absolute top-0 size-2 rounded-sm motion-safe:animate-confetti"
            style={{
              left: `${CONFETTI_OFFSET_PERCENT + index * CONFETTI_SPACING_PERCENT}%`,
              backgroundColor: `var(--color-pastel-${tone}-ink)`,
              animationDelay: `${index * CONFETTI_STAGGER_MS}ms`,
            }}
          />
        ))}
      </div>
      <div role="status" className="flex items-center gap-4">
        <RewardIllustration reward={first.reward} />
        <div>
          <h2 id="nuevo-logro" className="text-sm font-bold uppercase tracking-wide">¡Nuevo logro!</h2>
          <p className="text-lg font-extrabold">{first.reward.title}</p>
          <p>{first.reward.description}</p>
          {extra > 0 && <p className="text-lg font-semibold">Y {extra} {extra === 1 ? "logro más" : "logros más"}.</p>}
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            onDismiss();
            onOpenAchievements();
          }}
          className="min-h-12 rounded-control btn-primary font-bold px-5"
        >
          Ver mis logros
        </button>
        <button type="button" onClick={onDismiss} className="min-h-12 rounded-control border-2 border-current font-semibold px-5">
          Seguir
        </button>
      </div>
    </section>
  );
}
