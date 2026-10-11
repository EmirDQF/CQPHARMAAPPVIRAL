import { Bone } from "lucide-react";

interface BrandMarkProps {
  className?: string;
}

/** Marca de Artikare (icono menta + nombre) compartida por la landing y la app. */
export function BrandMark({ className = "" }: BrandMarkProps) {
  return (
    <span className={`flex items-center gap-2 font-extrabold tracking-tight text-clinic ${className}`}>
      <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-pastel-mint text-pastel-mint-ink">
        <Bone className="size-4" />
      </span>
      Artikare
    </span>
  );
}
