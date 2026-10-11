"use client";

import { FilePlus2 } from "lucide-react";
import { useState } from "react";
import { BoneSemaphoreWidget } from "./BoneSemaphoreWidget";
import { DexaTrendChart } from "./DexaTrendChart";
import { DexaVaultModal } from "./DexaVaultModal";
import { useClinicalStatus } from "./useActiveRedFlags";

export function DexaVaultSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { dexaEntries: entries, boneScan: scan } = useClinicalStatus();

  return (
    <div className="flex flex-col gap-6">
      <BoneSemaphoreWidget scan={scan} onUploadClick={() => setIsModalOpen(true)} />

      {entries.length > 0 && (
        <>
          <section
            id="tendencia"
            className="rounded-card border border-line bg-surface shadow-soft px-6 py-6 scroll-mt-20"
          >
            <DexaTrendChart entries={entries} />
          </section>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="min-h-12 self-start inline-flex items-center gap-2 rounded-control border-2 border-brand text-clinic font-semibold px-4 hover:bg-pastel-mint transition-colors"
          >
            <FilePlus2 aria-hidden="true" className="size-5 shrink-0" />
            Actualizar mi Bóveda DEXA
          </button>
        </>
      )}

      <DexaVaultModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
