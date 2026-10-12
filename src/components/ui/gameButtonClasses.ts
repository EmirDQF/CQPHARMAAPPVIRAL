import { cva } from "class-variance-authority";

/**
 * Botón "3D pressable" de la capa viva: relieve inferior en el tono oscuro del
 * mismo color (utilidad `pressable-3d` en globals.css), esquinas de 16 px,
 * letra black y objetivo táctil ≥ 48 px. Cada tono lleva su tinta AA (tokens.ts).
 * `gameButtonClasses` sirve también para un <Link> con el mismo aspecto.
 */
export const gameButtonClasses = cva(
  "pressable-3d inline-flex items-center justify-center gap-2 rounded-2xl font-black tracking-tight text-center select-none cursor-pointer aria-disabled:cursor-not-allowed aria-disabled:opacity-60 disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        vital: "bg-vital text-vital-ink [--edge:var(--color-vital-deep)]",
        streak: "bg-streak text-streak-ink [--edge:var(--color-streak-deep)]",
        xp: "bg-xp-strong text-xp-ink [--edge:var(--color-xp-deep)]",
        gold: "bg-gold text-gold-ink [--edge:var(--color-gold-deep)]",
        sky: "bg-sky text-sky-ink [--edge:var(--color-sky-deep)]",
        pink: "bg-pink text-pink-ink [--edge:var(--color-pink-deep)]",
        clinic: "bg-clinic text-white [--edge:var(--color-clinic-deep)]",
        surface: "border-2 border-line bg-surface text-clinic [--edge:var(--color-line)]",
      },
      size: {
        md: "min-h-12 px-5 text-lg [&_svg]:size-5",
        lg: "min-h-14 px-6 text-xl [&_svg]:size-6",
        xl: "min-h-16 px-8 text-2xl [&_svg]:size-7",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: { tone: "vital", size: "lg", block: false },
  }
);
