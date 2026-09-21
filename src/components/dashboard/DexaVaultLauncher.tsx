"use client";

import { useState } from "react";
import { DexaVaultModal } from "./DexaVaultModal";

export function DexaVaultLauncher() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="min-h-12 self-start rounded-xl border-2 border-brand text-brand font-semibold px-4 hover:bg-brand-light dark:hover:bg-brand-dark/30 transition-colors"
      >
        📋 Actualizar mi Bóveda DEXA
      </button>
      <DexaVaultModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
