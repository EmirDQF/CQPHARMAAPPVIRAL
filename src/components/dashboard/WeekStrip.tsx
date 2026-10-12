import { Check } from "lucide-react";
import type { DayAdherence, WeekDay } from "@/lib/dashboard/weekAdherence";

const DAY_STYLE: Record<DayAdherence, { dot: string; label: string }> = {
  complete: { dot: "bg-vital text-vital-ink", label: "tomas completas" },
  partial: { dot: "bg-gold text-gold-ink", label: "una toma" },
  none: { dot: "border-2 border-dashed border-line bg-canvas text-muted", label: "sin tomas" },
};

/** Tira de 7 días: verde = día completo, dorado = una toma, punteado = sin registro. Solo constancia, sin culpa. */
export function WeekStrip({ days }: { days: readonly WeekDay[] }) {
  const completeDays = days.filter((day) => day.adherence === "complete").length;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-base font-black text-clinic">Tu semana</h3>
        <p className="text-sm font-bold text-vital-text">
          {completeDays} {completeDays === 1 ? "día completo" : "días completos"}
        </p>
      </div>
      <ol className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const style = DAY_STYLE[day.adherence];
          return (
            <li
              key={day.isoDate}
              aria-label={`${day.weekdayLetter}${day.isToday ? " (hoy)" : ""}: ${style.label}`}
              className="flex flex-col items-center gap-1"
            >
              <span
                aria-hidden="true"
                className={`grid size-9 place-items-center rounded-full text-sm font-black ${style.dot} ${
                  day.isToday ? "ring-2 ring-clinic ring-offset-2 ring-offset-surface" : ""
                }`}
              >
                {day.adherence === "none" ? "" : day.adherence === "complete" ? <Check className="size-5" /> : day.takenCount}
              </span>
              <span aria-hidden="true" className={`text-xs font-bold ${day.isToday ? "text-clinic" : "text-muted"}`}>
                {day.weekdayLetter}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
