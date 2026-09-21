"use client";

import { useSyncExternalStore } from "react";
import { dexaVaultStore } from "@/lib/dashboard/dexaVault";
import type { BoneScanSummary } from "@/lib/dashboard/types";
import { BoneSemaphoreWidget } from "./BoneSemaphoreWidget";
import { DexaTrendChart } from "./DexaTrendChart";
import { DexaVaultLauncher } from "./DexaVaultLauncher";

interface DexaVaultSectionProps {
  fallbackScan: BoneScanSummary;
}

export function DexaVaultSection({ fallbackScan }: DexaVaultSectionProps) {
  const entries = useSyncExternalStore(
    dexaVaultStore.subscribe,
    dexaVaultStore.getSnapshot,
    dexaVaultStore.getServerSnapshot
  );

  return (
    <div className="flex flex-col gap-6">
      <BoneSemaphoreWidget fallbackScan={fallbackScan} />

      {entries.length > 0 && (
        <section
          id="tendencia"
          className="rounded-2xl border border-neutral-200 dark:border-neutral-800 px-6 py-6 scroll-mt-20"
        >
          <DexaTrendChart entries={entries} />
        </section>
      )}

      <DexaVaultLauncher />
    </div>
  );
}
