"use client";

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
}

interface ChoiceGroupProps<T extends string> {
  legend: string;
  name: string;
  options: readonly ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  stacked?: boolean;
  hint?: string;
}

/**
 * Radios nativos con aspecto de botón grande: nombre accesible (legend),
 * flechas del teclado sin código extra y foco visible. Usado en el perfil y el primer arranque.
 */
export function ChoiceGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  stacked = false,
  hint,
}: ChoiceGroupProps<T>) {
  const hintId = hint ? `${name}-hint` : undefined;
  return (
    <fieldset aria-describedby={hintId} className="flex flex-col gap-1">
      <legend className="text-lg font-bold">{legend}</legend>
      {hint && (
        <p id={hintId} className="text-base text-muted">
          {hint}
        </p>
      )}
      <div className={`mt-1 flex gap-3 ${stacked ? "flex-col" : "flex-wrap"}`}>
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex-1 min-h-12 flex items-center justify-center rounded-2xl border-2 px-4 py-2 text-lg font-bold text-center cursor-pointer transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-clinic ${
              value === option.value
                ? "border-vital-deep bg-pastel-mint text-pastel-mint-ink"
                : "border-line bg-surface"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
