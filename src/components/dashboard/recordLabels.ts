import type { DexaScanEntry } from "@/lib/dashboard/dexaVault";
import type { PainLogEntry } from "@/lib/dashboard/types";
import type { TrashedRecord } from "@/lib/storage/trash";

/** "2026-09-25" → "25/09/2026" (la fecha ISO ya es el día de Lima). */
export function formatIsoDateForDisplay(isoDate: string): string {
  return isoDate.split("-").reverse().join("/");
}

export function describeDexaScan(scan: DexaScanEntry): string {
  const worst = Math.min(scan.lumbarTScore, scan.femoralNeckTScore);
  return `Densitometría del ${formatIsoDateForDisplay(scan.date)} · peor T-score ${worst.toFixed(1)}`;
}

export function describePainLog(entry: PainLogEntry): string {
  return `Dolor del ${formatIsoDateForDisplay(entry.date)} · ${entry.painLevel}/10`;
}

export function describeTrashedRecord(item: TrashedRecord): string {
  return item.kind === "dexa" ? describeDexaScan(item.record) : describePainLog(item.record);
}
