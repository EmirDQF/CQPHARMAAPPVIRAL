import { cva } from "class-variance-authority";

/**
 * Botón pastel de la app: relleno claro, borde de 2 px en el tono más oscuro
 * del mismo color y tinta oscura (AA, tokens.ts). Sin relieve 3D ni brillos;
 * al pulsar, una ligera escala (`press-scale` en globals.css). Esquinas de
 * 16 px, letra bold y objetivo táctil ≥ 48 px (≥ 56 px en `lg` y `xl`).
 * `gameButtonClasses` sirve también para un <Link> con el mismo aspecto.
 */
export const gameButtonClasses = cva(
  "press-scale inline-flex items-center justify-center gap-2 rounded-control border-2 font-extrabold tracking-tight text-center select-none cursor-pointer aria-disabled:cursor-not-allowed aria-disabled:opacity-60 disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        vital: "border-vital-deep bg-vital text-vital-ink",
        streak: "border-streak-deep bg-streak text-streak-ink",
        xp: "border-xp-deep bg-xp text-xp-ink",
        gold: "border-gold-deep bg-gold text-gold-ink",
        sky: "border-sky-deep bg-sky text-sky-ink",
        pink: "border-pink-deep bg-pink text-pink-ink",
        surface: "border-line bg-surface text-clinic",
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
