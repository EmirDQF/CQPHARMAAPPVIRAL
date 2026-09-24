"use client";

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
            className="rounded-2xl border border-neutral-200 dark:border-neutral-800 px-6 py-6 scroll-mt-20"
          >
            <DexaTrendChart entries={entries} />
          </section>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="min-h-12 self-start rounded-xl border-2 border-brand text-brand font-semibold px-4 hover:bg-brand-light dark:hover:bg-brand-dark/30 transition-colors"
          >
            <span aria-hidden="true">📋 </span>Actualizar mi Bóveda DEXA
          </button>
        </>
      )}

      <DexaVaultModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
