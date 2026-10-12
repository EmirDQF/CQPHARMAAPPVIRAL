import { ArtikoMascot } from "@/components/mascot/ArtikoMascot";
import { formatLimaLongDate, limaGreeting } from "@/lib/dashboard/myDay";
import type { GameState } from "@/hooks/useGame";
import { STREAK_DAYS_PER_SHIELD } from "@/lib/clinical/constants";

const RING_SIZE = 96;
const RING_STROKE = 12;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function GoalRing({ done, goal }: { done: number; goal: number }) {
  const ratio = goal === 0 ? 0 : Math.min(done / goal, 1);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
      <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} role="img" aria-label={`Meta de hoy: ${done} de ${goal} misiones`} className="-rotate-90">
        <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} fill="none" stroke="var(--color-line)" strokeWidth={RING_STROKE} />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="var(--color-vital-deep)"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - ratio)}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <p aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-2xl font-black tabular-nums">
        {done}/{goal}
      </p>
      </div>
      <p className="text-base font-bold">Meta 🎯</p>
    </div>
  );
}

function StreakTile({ days, shields }: { days: number; shields: number }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-surface px-3 py-3 shadow-soft">
      <p className="flex items-center gap-1">
        <span aria-hidden="true" className="text-4xl">🔥</span>
        <span className="text-6xl font-black tabular-nums text-streak-text">{days}</span>
      </p>
      <p className="text-base font-bold">{days === 1 ? "día activo" : "días activos"}</p>
      <p className="text-sm text-muted">
        <span aria-hidden="true">❄️ </span>
        {shields > 0 ? `${shields} ${shields === 1 ? "día de gracia" : "días de gracia"}` : `Gracia cada ${STREAK_DAYS_PER_SHIELD} días`}
      </p>
    </div>
  );
}

function XpTile({ xp, level, xpIntoLevel, xpForLevel }: { xp: number; level: number; xpIntoLevel: number; xpForLevel: number }) {
  return (
    <div className="col-span-2 flex flex-col justify-center gap-2 rounded-2xl bg-surface px-4 py-3 shadow-soft">
      <div className="flex items-baseline justify-between gap-2">
        <p className="flex items-baseline gap-1">
          <span aria-hidden="true" className="text-2xl">⭐</span>
          <span className="text-4xl font-black tabular-nums text-xp-text">{xp}</span>
          <span className="text-lg font-bold">XP</span>
        </p>
        <p className="text-xl font-black">Nivel {level}</p>
      </div>
      <div
        role="progressbar"
        aria-label={`Nivel ${level}: ${xpIntoLevel} de ${xpForLevel} XP para el siguiente`}
        aria-valuemin={0}
        aria-valuemax={xpForLevel}
        aria-valuenow={xpIntoLevel}
        className="h-3 w-full overflow-hidden rounded-full bg-pastel-lavender"
      >
        <div className="h-full rounded-full bg-xp transition-[width] duration-500" style={{ width: `${(xpIntoLevel / xpForLevel) * 100}%` }} />
      </div>
    </div>
  );
}

interface TodayHeroProps {
  game: GameState;
  firstName: string | null;
  now: Date;
}

/** Saludo de Artiko con la siguiente misión (al abrir, sin notificación), racha gigante, XP y meta. */
export function TodayHero({ game, firstName, now }: TodayHeroProps) {
  const { mood, stats, goal } = game;
  return (
    <section aria-labelledby="mi-dia-saludo" className="flex flex-col gap-4">
      <div>
        <p className="text-base font-bold text-muted first-letter:uppercase">{formatLimaLongDate(now)}</p>
        <h1 id="mi-dia-saludo" className="text-4xl font-black leading-tight tracking-tight text-clinic">
          {limaGreeting(now)}
          {firstName ? `, ${firstName}` : ""}
        </h1>
      </div>
      <div className="flex items-end gap-3">
        <ArtikoMascot emotion={mood.emotion} accessories={game.progress.equipped} size={120} className="shrink-0" />
        <p role="status" aria-label="Artiko dice" className="relative mb-4 flex-1 rounded-2xl border-2 border-line bg-surface px-4 py-3 text-lg font-bold shadow-soft">
          {mood.message}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StreakTile days={stats.streak.days} shields={stats.streak.shields} />
        <div className="flex items-center justify-center rounded-2xl bg-surface px-2 py-3 shadow-soft">
          <GoalRing done={goal.done} goal={goal.goal} />
        </div>
        <XpTile xp={stats.xp} level={stats.level.level} xpIntoLevel={stats.level.xpIntoLevel} xpForLevel={stats.level.xpForLevel} />
      </div>
    </section>
  );
}
