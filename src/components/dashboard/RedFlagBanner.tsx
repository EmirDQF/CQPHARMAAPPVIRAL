"use client";

import Link from "next/link";
import { RED_FLAG_DESCRIPTION } from "@/lib/clinical/redFlags";
import { useActiveRedFlags } from "./useActiveRedFlags";

/** Bandera roja clínica: siempre por encima de cualquier CTA de producto, en todas las pestañas. */
export function RedFlagBanner() {
  const flags = useActiveRedFlags();
  if (flags.length === 0) return null;

  return (
    // Región persistente (no role="alert"): reaparece en cada visita y no debe interrumpir al lector de pantalla.
    <section
      aria-labelledby="red-flag-heading"
      className="rounded-2xl border-2 border-risk-high bg-risk-high-bg text-neutral-900 px-5 py-4 flex flex-col gap-3"
    >
      <h2 id="red-flag-heading" className="text-lg font-bold text-risk-high">
        <span aria-hidden="true">🩺 </span>Requiere evaluación reumatológica
      </h2>
      <ul className="flex flex-col gap-1">
        {flags.map((flag) => (
          <li key={flag}>{RED_FLAG_DESCRIPTION[flag]}</li>
        ))}
      </ul>
      <p className="text-sm">
        Consulta con tu reumatólogo antes de iniciar o cambiar cualquier suplemento. Los
        suplementos no reemplazan el tratamiento médico.
      </p>
      <Link
        href="/citas"
        className="min-h-12 flex items-center justify-center rounded-xl bg-risk-high text-white font-semibold px-5"
      >
        Agendar evaluación reumatológica
      </Link>
    </section>
  );
}
