import type { DayProgress } from "@/lib/dashboard/myDay";

const SIZE = 112;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface DayProgressRingProps {
  progress: DayProgress;
}

/** Anillo del día: tomas + chequeo hechos hoy. El trazo usa `progress` (AA 3:1 sobre menta y superficie). */
export function DayProgressRing({ progress }: DayProgressRingProps) {
  const isComplete = progress.done === progress.total;
  return (
    <div className="flex items-center gap-4">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`Progreso de hoy: ${progress.done} de ${progress.total} tareas`}
        className="shrink-0 -rotate-90"
      >
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--color-surface)" strokeWidth={STROKE} />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-progress)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress.ratio)}
          className="transition-[stroke-dashoffset] duration-250 ease-out"
        />
      </svg>
      <div aria-live="polite">
        <p className="text-3xl font-extrabold leading-none">
          {progress.done}
          <span className="text-lg font-bold"> de {progress.total}</span>
        </p>
        <p className="font-semibold">{isComplete ? "¡Día completo!" : "tareas de hoy"}</p>
        <p className="text-sm">Tomas y chequeo diario</p>
      </div>
    </div>
  );
}
