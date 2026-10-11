import type { StreakSummary } from "@/lib/dashboard/pillbox";
import { formatLimaLongDate, limaGreeting } from "@/lib/dashboard/myDay";

interface DayHeaderProps {
  firstName: string | null;
  streak: StreakSummary;
  /** Ya registró tomas antes: con racha en 0, se le da la bienvenida de vuelta (sin culpa). */
  hasHistory: boolean;
  now: Date;
}

function streakLabel(days: number): string {
  if (days === 0) return "Tu racha empieza hoy";
  return days === 1 ? "1 día seguido" : `${days} días seguidos`;
}

function graceLabel(shields: number): string {
  return `${shields} ${shields === 1 ? "día de gracia" : "días de gracia"}`;
}

export function DayHeader({ firstName, streak, hasHistory, now }: DayHeaderProps) {
  const isReturning = hasHistory && streak.days === 0;
  return (
    <section aria-labelledby="mi-dia-saludo" className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold text-muted first-letter:uppercase">{formatLimaLongDate(now)}</p>
        <h1 id="mi-dia-saludo" className="text-2xl font-extrabold text-clinic">
          {limaGreeting(now)}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        {isReturning && <p className="font-medium">Qué bueno verte de nuevo. Retomamos hoy, con calma.</p>}
      </div>
      <ul className="flex flex-wrap gap-2 text-sm" aria-label="Tu constancia">
        <li className="rounded-full bg-pastel-peach text-pastel-peach-ink px-4 py-2 font-bold">
          <span aria-hidden="true">🔥 </span>
          {streakLabel(streak.days)}
        </li>
        <li className="rounded-full bg-pastel-lavender text-pastel-lavender-ink px-4 py-2 font-semibold">
          <span aria-hidden="true">🛡️ </span>
          {graceLabel(streak.shields)}
        </li>
      </ul>
    </section>
  );
}
