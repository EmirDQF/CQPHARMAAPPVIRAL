"use client";

import { useSyncExternalStore } from "react";
import { detectRedFlags, type RedFlag } from "@/lib/clinical/redFlags";
import {
  buildBoneScanSummaryFromEntries,
  dexaVaultStore,
  selectValidDexaEntries,
  type DexaScanEntry,
} from "@/lib/dashboard/dexaVault";
import { painLogStore } from "@/lib/dashboard/painLog";
import { patientProfileStore, type PatientProfile } from "@/lib/dashboard/patientProfile";
import type { BoneScanSummary } from "@/lib/dashboard/types";

export interface ClinicalStatus {
  profile: PatientProfile;
  /** Solo estudios válidos (sin entradas corruptas de localStorage). */
  dexaEntries: DexaScanEntry[];
  /** Con bandera roja activa, su mensaje ya prioriza al reumatólogo. */
  boneScan: BoneScanSummary | null;
  redFlags: RedFlag[];
}

/** Única fuente del estado clínico en pantalla: perfil, semáforo óseo y banderas rojas. */
export function useClinicalStatus(): ClinicalStatus {
  const storedDexaEntries = useSyncExternalStore(
    dexaVaultStore.subscribe,
    dexaVaultStore.getSnapshot,
    dexaVaultStore.getServerSnapshot
  );
  const profile = useSyncExternalStore(
    patientProfileStore.subscribe,
    patientProfileStore.getSnapshot,
    patientProfileStore.getServerSnapshot
  );
  const painEntries = useSyncExternalStore(
    painLogStore.subscribe,
    painLogStore.getSnapshot,
    painLogStore.getServerSnapshot
  );

  const dexaEntries = selectValidDexaEntries(storedDexaEntries);
  const scanWithoutFlags = buildBoneScanSummaryFromEntries(dexaEntries, { patient: profile });
  const redFlags = detectRedFlags({
    worstTScore: scanWithoutFlags?.worstTScore ?? null,
    requiresZScore: scanWithoutFlags?.interpretation === "z-score-required",
    hasFractureHistory: profile.hasFractureHistory,
    painEntries,
  });
  const boneScan =
    redFlags.length > 0
      ? buildBoneScanSummaryFromEntries(dexaEntries, { patient: profile, hasRedFlag: true })
      : scanWithoutFlags;

  return { profile, dexaEntries, boneScan, redFlags };
}

export function useActiveRedFlags(): RedFlag[] {
  return useClinicalStatus().redFlags;
}
