import { Flame, ShieldCheck, Sparkles, Sprout } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  return `Escudo de constancia activo · ${shields} ${shields === 1 ? "día de gracia" : "días de gracia"}`;
}

export function DayHeader({ firstName, streak, hasHistory, now }: DayHeaderProps) {
  const isReturning = streak !== null && hasHistory && streak.days === 0;
  const StreakIcon = streak && streak.days > 0 ? Flame : Sprout;
  return (
    <section aria-labelledby="mi-dia-saludo" className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <p className="min-h-5 text-sm font-semibold text-muted first-letter:uppercase">{now ? formatLimaLongDate(now) : ""}</p>
        <h1 id="mi-dia-saludo" className="text-2xl font-extrabold tracking-tight text-clinic">
          {now ? limaGreeting(now) : "Hola"}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        {isReturning && (
          <p className="flex items-center gap-1.5 font-medium text-ink">
            <Sparkles aria-hidden="true" className="size-4 shrink-0 text-clinic" />
            Qué bueno verte de nuevo. Retomamos hoy, con calma.
          </p>
        )}
      </div>
      {streak ? (
        <ul className="min-h-20 flex flex-wrap content-start gap-2" aria-label="Tu constancia">
          <li className="animate-fade-in">
            <Badge variant="peach" size="lg" className="font-bold">
              <StreakIcon aria-hidden="true" />
              {streakLabel(streak.days)}
            </Badge>
          </li>
          <li className="animate-fade-in">
            <Badge variant={streak.shields > 0 ? "mint" : "lavender"} size="lg">
              <ShieldCheck aria-hidden="true" />
              {graceLabel(streak.shields)}
            </Badge>
          </li>
        </ul>
      ) : (
        <div aria-hidden="true" className="min-h-20 flex flex-wrap content-start gap-2 motion-safe:animate-pulse">
          <span className="h-9 w-40 rounded-full bg-pastel-peach" />
          <span className="h-9 w-36 rounded-full bg-pastel-lavender" />
        </div>
      )}
    </section>
  );
}
