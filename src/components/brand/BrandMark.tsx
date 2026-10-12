import { ArtikoFigure } from "@/components/mascot/ArtikoFigure";

interface BrandMarkProps {
  className?: string;
}

/** Marca de Artikare (Artiko, la mascota, sobre menta + nombre), igual que el icono de la app. */
export function BrandMark({ className = "" }: BrandMarkProps) {
  return (
    <span className={`flex items-center gap-2 font-extrabold tracking-tight text-clinic ${className}`}>
      <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-pastel-mint">
        <ArtikoFigure emotion="happy" size={28} decorative />
      </span>
      Artikare
    </span>
  );
}
