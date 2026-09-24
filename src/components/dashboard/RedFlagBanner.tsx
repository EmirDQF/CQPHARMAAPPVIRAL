"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { detectRedFlags, type RedFlag } from "@/lib/clinical/redFlags";
import { buildBoneScanSummaryFromEntries, dexaVaultStore } from "@/lib/dashboard/dexaVault";
import { patientProfileStore } from "@/lib/dashboard/patientProfile";

const RED_FLAG_REASON: Record<RedFlag, string> = {
  osteoporosis: "Tu última densitometría está en rango de osteoporosis (T-score ≤ -2.5).",
  "fracture-history": "Registraste antecedente de fractura.",
};

/** Bandera roja clínica: siempre por encima de cualquier CTA de producto, en todas las pestañas. */
export function RedFlagBanner() {
  const dexaEntries = useSyncExternalStore(
    dexaVaultStore.subscribe,
    dexaVaultStore.getSnapshot,
    dexaVaultStore.getServerSnapshot
  );
  const profile = useSyncExternalStore(
    patientProfileStore.subscribe,
    patientProfileStore.getSnapshot,
    patientProfileStore.getServerSnapshot
  );

  const flags = detectRedFlags({
    worstTScore: buildBoneScanSummaryFromEntries(dexaEntries)?.worstTScore ?? null,
    hasFractureHistory: profile.hasFractureHistory,
  });
  if (flags.length === 0) return null;

  return (
    // Región persistente (no role="alert"): reaparece en cada visita y no debe interrumpir al lector de pantalla.
    <section
      aria-labelledby="red-flag-heading"
      className="rounded-2xl border-2 border-risk-high bg-risk-high-bg text-neutral-900 px-5 py-4 flex flex-col gap-3"
    >
      <h2 id="red-flag-heading" className="text-lg font-bold text-risk-high">
        🩺 Requiere evaluación reumatológica
      </h2>
      <ul className="flex flex-col gap-1">
        {flags.map((flag) => (
          <li key={flag}>{RED_FLAG_REASON[flag]}</li>
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
