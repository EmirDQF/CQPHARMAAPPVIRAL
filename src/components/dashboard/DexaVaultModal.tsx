"use client";

import { useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import {
  addDexaScanEntry,
  buildBoneScanSummaryFromEntries,
  dexaVaultStore,
  type DexaScanEntry,
} from "@/lib/dashboard/dexaVault";

interface DexaVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CHART_WIDTH = 280;
const CHART_HEIGHT = 100;
const MIN_T_SCORE = -4;
const MAX_T_SCORE = 1;

function scoreToY(score: number): number {
  const clamped = Math.min(MAX_T_SCORE, Math.max(MIN_T_SCORE, score));
  const ratio = (clamped - MIN_T_SCORE) / (MAX_T_SCORE - MIN_T_SCORE);
  return CHART_HEIGHT - ratio * CHART_HEIGHT;
}

function buildPolylinePoints(
  entries: DexaScanEntry[],
  selector: (entry: DexaScanEntry) => number
): string {
  if (entries.length === 0) return "";
  const stepX = entries.length > 1 ? CHART_WIDTH / (entries.length - 1) : 0;
  return entries
    .map((entry, index) => `${index * stepX},${scoreToY(selector(entry))}`)
    .join(" ");
}

export function DexaVaultModal({ isOpen, onClose }: DexaVaultModalProps) {
  const entries = useSyncExternalStore(
    dexaVaultStore.subscribe,
    dexaVaultStore.getSnapshot,
    dexaVaultStore.getServerSnapshot
  );

  const [lumbarTScore, setLumbarTScore] = useState("");
  const [femoralNeckTScore, setFemoralNeckTScore] = useState("");
  const [scanDate, setScanDate] = useState("");
  const [radiologyCenter, setRadiologyCenter] = useState("");

  const summary = useMemo(() => buildBoneScanSummaryFromEntries(entries), [entries]);
  const lumbarPoints = useMemo(
    () => buildPolylinePoints(entries, (entry) => entry.lumbarTScore),
    [entries]
  );
  const femoralPoints = useMemo(
    () => buildPolylinePoints(entries, (entry) => entry.femoralNeckTScore),
    [entries]
  );

  if (!isOpen) return null;

  const parsedLumbar = Number(lumbarTScore);
  const parsedFemoral = Number(femoralNeckTScore);
  const isValid =
    lumbarTScore.trim() !== "" &&
    femoralNeckTScore.trim() !== "" &&
    !Number.isNaN(parsedLumbar) &&
    !Number.isNaN(parsedFemoral) &&
    scanDate.trim() !== "" &&
    radiologyCenter.trim().length > 1;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid) return;
    addDexaScanEntry({
      date: scanDate,
      lumbarTScore: parsedLumbar,
      femoralNeckTScore: parsedFemoral,
      radiologyCenter: radiologyCenter.trim(),
    });
    setLumbarTScore("");
    setFemoralNeckTScore("");
    setScanDate("");
    setRadiologyCenter("");
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dexa-vault-heading"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 py-6"
    >
      <div className="w-full max-w-lg max-h-full overflow-y-auto rounded-2xl bg-background border-2 border-neutral-200 dark:border-neutral-800 px-6 py-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 id="dexa-vault-heading" className="text-xl font-bold">
            Bóveda Densitométrica DEXA
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="min-h-12 min-w-12 rounded-xl text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {summary && (
          <div className="rounded-xl border-2 border-brand px-4 py-3">
            <p className="text-sm font-semibold">
              {summary.diagnosisLabel} · Peor T-Score: {summary.tScoreHip.toFixed(1)}
            </p>
            <p className="text-sm">{summary.diagnosisMessage}</p>
          </div>
        )}

        {entries.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Evolución del T-Score</p>
            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              className="w-full h-28"
              role="img"
              aria-label="Evolución del T-Score lumbar y femoral en el tiempo"
              preserveAspectRatio="none"
            >
              <polyline points={lumbarPoints} fill="none" stroke="var(--color-brand)" strokeWidth={2} />
              <polyline
                points={femoralPoints}
                fill="none"
                stroke="var(--color-risk-moderate)"
                strokeWidth={2}
              />
            </svg>
            <div className="flex gap-4 text-xs text-neutral-500 mt-1">
              <span>— Columna Lumbar</span>
              <span className="text-risk-moderate">— Cuello Femoral</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <p className="text-sm font-medium">Registrar nuevo estudio</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm">T-Score Lumbar (L1-L4)</span>
              <input
                value={lumbarTScore}
                onChange={(e) => setLumbarTScore(e.target.value)}
                inputMode="decimal"
                className="min-h-12 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 px-3 bg-transparent"
                placeholder="-1.6"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">T-Score Cuello Femoral</span>
              <input
                value={femoralNeckTScore}
                onChange={(e) => setFemoralNeckTScore(e.target.value)}
                inputMode="decimal"
                className="min-h-12 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 px-3 bg-transparent"
                placeholder="-1.4"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-sm">Fecha del estudio</span>
            <input
              type="date"
              value={scanDate}
              onChange={(e) => setScanDate(e.target.value)}
              className="min-h-12 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 px-3 bg-transparent"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm">Centro radiológico</span>
            <input
              value={radiologyCenter}
              onChange={(e) => setRadiologyCenter(e.target.value)}
              className="min-h-12 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 px-3 bg-transparent"
              placeholder="Ej. Clínica San Pablo"
            />
          </label>
          <button
            type="submit"
            disabled={!isValid}
            className="min-h-12 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-lg transition-colors"
          >
            Guardar Estudio
          </button>
        </form>
      </div>
    </div>
  );
}
