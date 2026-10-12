interface StepProgressProps {
  /** Paso actual, empezando en 1. */
  current: number;
  total: number;
}

/** Puntos de avance del primer arranque: el paso actual se alarga; texto "Paso X de Y" para lectores de pantalla y vista. */
export function StepProgress({ current, total }: StepProgressProps) {
  return (
    <div className="mb-6 flex flex-col items-center gap-2">
      <ol aria-hidden="true" className="flex items-center gap-2">
        {Array.from({ length: total }, (_, index) => (
          <li
            key={index}
            className={`h-3 rounded-full transition-all duration-200 ${
              index + 1 === current ? "w-8 bg-vital" : index + 1 < current ? "w-3 bg-vital-deep" : "w-3 bg-line"
            }`}
          />
        ))}
      </ol>
      <p className="text-base font-bold text-muted">
        Paso {current} de {total}
      </p>
    </div>
  );
}
