interface ProgressRingProps {
  /** 0 a 100. */
  percent: number;
  /** Texto grande al centro (p. ej. "57 %" o "12"). */
  value: string;
  label: string;
  /** Descripción completa para lectores de pantalla. */
  ariaLabel: string;
  tone: "vital" | "xp" | "streak" | "sky";
}

const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const MAX_PERCENT = 100;

const STROKE: Record<ProgressRingProps["tone"], string> = {
  vital: "stroke-vital-deep",
  xp: "stroke-xp-deep",
  streak: "stroke-streak-deep",
  sky: "stroke-sky-deep",
};

/** Anillo de progreso SVG propio; se llena con una transición (nada con movimiento reducido). */
export function ProgressRing({ percent, value, label, ariaLabel, tone }: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(MAX_PERCENT, percent));
  const offset = CIRCUMFERENCE * (1 - clamped / MAX_PERCENT);
  return (
    <figure role="img" aria-label={ariaLabel} className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 80 80" className="size-24" aria-hidden="true">
        <circle cx="40" cy="40" r={RADIUS} fill="none" strokeWidth="8" className="stroke-line" />
        <circle
          cx="40"
          cy="40"
          r={RADIUS}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 40 40)"
          className={`${STROKE[tone]} transition-[stroke-dashoffset] duration-700 ease-out`}
        />
        <text x="40" y="46" textAnchor="middle" className="fill-foreground text-[18px] font-black">
          {value}
        </text>
      </svg>
      <figcaption className="text-center text-base font-bold">{label}</figcaption>
    </figure>
  );
}
