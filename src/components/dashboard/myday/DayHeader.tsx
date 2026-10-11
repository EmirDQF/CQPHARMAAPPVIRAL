import type { StreakSummary } from "@/lib/dashboard/pillbox";
import { formatLimaLongDate, limaGreeting } from "@/lib/dashboard/myDay";

interface DayHeaderProps {
  firstName: string | null;
  /** null mientras se lee el celular: se muestran chips esqueleto del mismo tamaño (sin "0 días" falsos ni saltos). */
  streak: StreakSummary | null;
  /** Ya registró tomas antes: con racha en 0, se le da la bienvenida de vuelta (sin culpa). */
  hasHistory: boolean;
  /** null hasta hidratar: sin fecha ni saludo del momento del build. */
  now: Date | null;
}

function streakLabel(days: number): string {
  if (days === 0) return "Tu racha empieza hoy";
  return days === 1 ? "1 día seguido" : `${days} días seguidos`;
}

function graceLabel(shields: number): string {
  if (shields === 0) return "1 día de gracia cada 7 días completos";
  return `${shields} ${shields === 1 ? "día de gracia" : "días de gracia"}`;
}

export function DayHeader({ firstName, streak, hasHistory, now }: DayHeaderProps) {
  const isReturning = streak !== null && hasHistory && streak.days === 0;
  return (
    <section aria-labelledby="mi-dia-saludo" className="flex flex-col gap-3">
      <div>
        <p className="min-h-5 text-sm font-semibold text-muted first-letter:uppercase">{now ? formatLimaLongDate(now) : ""}</p>
        <h1 id="mi-dia-saludo" className="text-2xl font-extrabold text-clinic">
          {now ? limaGreeting(now) : "Hola"}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        {isReturning && <p className="font-medium">Qué bueno verte de nuevo. Retomamos hoy, con calma.</p>}
      </div>
      {streak ? (
        <ul className="min-h-20 flex flex-wrap content-start gap-2 text-sm" aria-label="Tu constancia">
          <li className="rounded-full bg-pastel-peach text-pastel-peach-ink px-4 py-2 font-bold">
            <span aria-hidden="true">🔥 </span>
            {streakLabel(streak.days)}
          </li>
          <li className="rounded-full bg-pastel-lavender text-pastel-lavender-ink px-4 py-2 font-semibold">
            <span aria-hidden="true">🛡️ </span>
            {graceLabel(streak.shields)}
          </li>
        </ul>
      ) : (
        <div aria-hidden="true" className="min-h-20 flex flex-wrap content-start gap-2 text-sm motion-safe:animate-pulse">
          <span className="h-9 w-40 rounded-full bg-pastel-peach" />
          <span className="h-9 w-36 rounded-full bg-pastel-lavender" />
        </div>
      )}
    </section>
  );
}
