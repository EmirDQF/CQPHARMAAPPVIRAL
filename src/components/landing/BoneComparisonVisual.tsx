const DENSE_TRABECULAE = Array.from({ length: 36 }, (_, i) => i);
const SPARSE_TRABECULAE = Array.from({ length: 10 }, (_, i) => i);

function seededOffset(seed: number, range: number): number {
  return ((Math.sin(seed * 12.9898) * 43758.5453) % 1) * range;
}

interface BoneCrossSectionProps {
  variant: "healthy" | "osteoporotic";
  label: string;
}

function BoneCrossSection({ variant, label }: BoneCrossSectionProps) {
  const isHealthy = variant === "healthy";
  const points = isHealthy ? DENSE_TRABECULAE : SPARSE_TRABECULAE;
  const strokeColor = isHealthy ? "var(--color-risk-low)" : "var(--color-risk-high)";

  return (
    <div className="flex-1 flex flex-col items-center gap-3">
      <svg
        viewBox="0 0 160 160"
        role="img"
        aria-label={label}
        className="w-full max-w-[180px]"
      >
        <circle
          cx="80"
          cy="80"
          r="72"
          fill={isHealthy ? "var(--color-risk-low-bg)" : "var(--color-risk-high-bg)"}
          stroke={strokeColor}
          strokeWidth="4"
        />
        {points.map((i) => {
          const angle = (i / points.length) * Math.PI * 2;
          const jitter = seededOffset(i + (isHealthy ? 0 : 100), 10);
          const radius = 20 + jitter;
          const x1 = 80 + Math.cos(angle) * radius;
          const y1 = 80 + Math.sin(angle) * radius;
          const x2 = 80 + Math.cos(angle) * (radius + (isHealthy ? 34 : 20));
          const y2 = 80 + Math.sin(angle) * (radius + (isHealthy ? 34 : 20));
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={strokeColor}
              strokeWidth={isHealthy ? 3 : 1.5}
              strokeLinecap="round"
              opacity={isHealthy ? 0.8 : 0.55}
            />
          );
        })}
        <circle cx="80" cy="80" r="10" fill={strokeColor} opacity={0.9} />
      </svg>
      <p className="text-sm font-semibold text-center">{label}</p>
    </div>
  );
}

export function BoneComparisonVisual() {
  return (
    <div className="w-full flex items-center gap-4 sm:gap-8 justify-center py-4">
      <BoneCrossSection variant="healthy" label="Hueso Sano" />
      <div className="text-2xl text-neutral-300 dark:text-neutral-700" aria-hidden="true">
        vs
      </div>
      <BoneCrossSection variant="osteoporotic" label="Hueso con Osteoporosis" />
    </div>
  );
}
