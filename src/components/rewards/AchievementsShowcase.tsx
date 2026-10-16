"use client";

import type { RewardsState } from "@/hooks/useRewards";
import { buildShowcase, type UpcomingGoal } from "@/lib/rewards/showcase";
import { RewardIllustration } from "./RewardIllustration";
import { TONE_CARD_CLASS } from "./toneClasses";

interface AchievementsShowcaseProps {
  rewards: Pick<RewardsState, "catalog" | "stats" | "progress">;
}

function GoalRow({ goal }: { goal: UpcomingGoal }) {
  const { reward, progress } = goal;
  return (
    <li className="rounded-card border border-line bg-surface px-4 py-4 flex items-center gap-4">
      <RewardIllustration reward={reward} isLocked />
      <div className="flex-1 flex flex-col gap-2">
        <p className="font-bold">{reward.title}</p>
        <p className="text-lg text-muted">{reward.description}</p>
        {progress ? (
          <>
            <progress
              className="h-3 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-pastel-mint [&::-webkit-progress-value]:bg-progress [&::-moz-progress-bar]:bg-progress"
              max={progress.target}
              value={progress.current}
              aria-label={`${reward.title}: ${progress.current} de ${progress.target}`}
            />
            <p className="text-lg font-semibold">{progress.current} de {progress.target}</p>
          </>
        ) : (
          <p className="text-lg font-semibold">Llega cuando retomas tu cuidado después de una pausa.</p>
        )}
      </div>
    </li>
  );
}

/** Vitrina "Mis logros": lo logrado (nunca se quita) y las próximas metas de constancia. */
export function AchievementsShowcase({ rewards }: AchievementsShowcaseProps) {
  const { earned, upcoming } = buildShowcase(rewards.catalog, rewards.stats, rewards.progress);
  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="mis-logros" className="flex flex-col gap-3">
        <h2 id="mis-logros" className="text-[1.75rem] font-extrabold text-clinic">Mis logros</h2>
        <p className="text-muted">
          Reconocen tu constancia: cada día que vuelves suma. Si haces una pausa, tus logros se quedan contigo.
        </p>
        {earned.length === 0 ? (
          <p className="rounded-card bg-pastel-sky text-pastel-sky-ink px-4 py-4 font-medium">
            Tu primer logro llega al anotar todas tus tomas de un día.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {earned.map(({ reward, times }) => (
              <li key={reward.id} className={`rounded-card px-3 py-4 flex flex-col items-center gap-2 text-center ${TONE_CARD_CLASS[reward.tone]}`}>
                <RewardIllustration reward={reward} />
                <p className="font-bold leading-tight">{reward.title}</p>
                {times > 1 && <p className="text-lg font-semibold">× {times}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
      {upcoming.length > 0 && (
        <section aria-labelledby="proximas-metas" className="flex flex-col gap-3">
          <h3 id="proximas-metas" className="text-xl font-bold text-clinic">Próximas metas</h3>
          <ul className="flex flex-col gap-3">
            {upcoming.map((goal) => (
              <GoalRow key={goal.reward.id} goal={goal} />
            ))}
          </ul>
        </section>
      )}
      <p className="text-lg text-muted">
        Los logros se guardan solo en este celular y no incluyen datos de tu salud.
      </p>
    </div>
  );
}
