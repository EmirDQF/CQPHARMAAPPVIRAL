"use client";

import { useState, type FormEvent } from "react";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { addDexaScanEntry, parseTScoreInput, validateScanDate } from "@/lib/dashboard/dexaVault";
import { toLimaIsoDate } from "@/lib/utils/date";
import { DexaTrendChart } from "./DexaTrendChart";
import { useClinicalStatus } from "./useActiveRedFlags";

type DexaField = "lumbar" | "femoral" | "date" | "center";

const NONE_TOUCHED: Record<DexaField, boolean> = {
  lumbar: false,
  femoral: false,
  date: false,
  center: false,
};
const ALL_TOUCHED: Record<DexaField, boolean> = {
  lumbar: true,
  femoral: true,
  date: true,
  center: true,
};
const MIN_CENTER_LENGTH = 2;

interface DexaVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DexaVaultModal({ isOpen, onClose }: DexaVaultModalProps) {
  const { dexaEntries: entries, boneScan: summary } = useClinicalStatus();

  const [lumbarTScore, setLumbarTScore] = useState("");
  const [femoralNeckTScore, setFemoralNeckTScore] = useState("");
  const [scanDate, setScanDate] = useState("");
  const [radiologyCenter, setRadiologyCenter] = useState("");
  const [touched, setTouched] = useState<Record<DexaField, boolean>>(NONE_TOUCHED);

  if (!isOpen) return null;

  const todayIso = toLimaIsoDate();
  const lumbarResult = parseTScoreInput(lumbarTScore);
  const femoralResult = parseTScoreInput(femoralNeckTScore);
  const scanDateError = validateScanDate(scanDate, todayIso);
  const hasPositiveTScore =
    (lumbarResult.ok && lumbarResult.value > 0) || (femoralResult.ok && femoralResult.value > 0);
  const isCenterValid = radiologyCenter.trim().length >= MIN_CENTER_LENGTH;

  // Los errores aparecen al salir del campo o al intentar guardar, no en cada tecla.
  const lumbarError = touched.lumbar && !lumbarResult.ok ? lumbarResult.error : null;
  const femoralError = touched.femoral && !femoralResult.ok ? femoralResult.error : null;
  const dateError = touched.date ? scanDateError : null;
  const centerError =
    touched.center && !isCenterValid
      ? `Ingresa el nombre del centro (mínimo ${MIN_CENTER_LENGTH} caracteres)`
      : null;

  function markTouched(field: DexaField) {
    setTouched((previous) => ({ ...previous, [field]: true }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!lumbarResult.ok || !femoralResult.ok || scanDateError !== null || !isCenterValid) {
      setTouched(ALL_TOUCHED);
      return;
    }
    addDexaScanEntry({
      date: scanDate,
      lumbarTScore: lumbarResult.value,
      femoralNeckTScore: femoralResult.value,
      radiologyCenter: radiologyCenter.trim(),
    });
    setLumbarTScore("");
    setFemoralNeckTScore("");
    setScanDate("");
    setRadiologyCenter("");
    setTouched(NONE_TOUCHED);
  }

  return (
    <ModalDialog labelledBy="dexa-vault-heading" onClose={onClose}>
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
              {summary.diagnosisLabel} · Peor T-Score: {summary.worstTScore.toFixed(1)}
            </p>
            <p className="text-sm">{summary.diagnosisMessage}</p>
            {summary.profileNote && (
              <p role="note" className="text-sm font-semibold">
                <span aria-hidden="true">⚠️ </span>
                <span className="sr-only">Aviso: </span>
                {summary.profileNote}
              </p>
            )}
          </div>
        )}

        <DexaTrendChart entries={entries} />

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
          <p className="font-medium">Registrar nuevo estudio</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span>T-Score Lumbar (L1-L4)</span>
              <input
                value={lumbarTScore}
                onChange={(e) => setLumbarTScore(e.target.value)}
                onBlur={() => markTouched("lumbar")}
                inputMode="decimal"
                aria-invalid={lumbarError !== null}
                aria-describedby={lumbarError ? "dexa-lumbar-error" : undefined}
                className="min-h-12 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 px-3 bg-transparent"
                placeholder="-1.6"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>T-Score Cuello Femoral</span>
              <input
                value={femoralNeckTScore}
                onChange={(e) => setFemoralNeckTScore(e.target.value)}
                onBlur={() => markTouched("femoral")}
                inputMode="decimal"
                aria-invalid={femoralError !== null}
                aria-describedby={femoralError ? "dexa-femoral-error" : undefined}
                className="min-h-12 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 px-3 bg-transparent"
                placeholder="-1.4"
              />
            </label>
          </div>
          <div aria-live="polite" className="flex flex-col gap-1">
            {lumbarError && (
              <p id="dexa-lumbar-error" className="text-risk-high dark:text-red-300">
                Lumbar: {lumbarError}
              </p>
            )}
            {femoralError && (
              <p id="dexa-femoral-error" className="text-risk-high dark:text-red-300">
                Cuello femoral: {femoralError}
              </p>
            )}
            {hasPositiveTScore && (
              <p className="text-risk-moderate dark:text-amber-300">
                Ingresaste un T-score positivo. Verifica en tu informe que no falte el signo
                menos (-).
              </p>
            )}
          </div>
          <label className="flex flex-col gap-1">
            <span>Fecha del estudio</span>
            <input
              type="date"
              max={todayIso}
              value={scanDate}
              onChange={(e) => setScanDate(e.target.value)}
              onBlur={() => markTouched("date")}
              aria-invalid={dateError !== null}
              aria-describedby={dateError ? "dexa-date-error" : undefined}
              className="min-h-12 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 px-3 bg-transparent"
            />
          </label>
          <p id="dexa-date-error" aria-live="polite" className="text-risk-high dark:text-red-300 empty:hidden">
            {dateError}
          </p>
          <label className="flex flex-col gap-1">
            <span>Centro radiológico</span>
            <input
              value={radiologyCenter}
              onChange={(e) => setRadiologyCenter(e.target.value)}
              onBlur={() => markTouched("center")}
              aria-invalid={centerError !== null}
              aria-describedby={centerError ? "dexa-center-error" : undefined}
              className="min-h-12 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 px-3 bg-transparent"
              placeholder="Ej. Clínica San Pablo"
            />
          </label>
          <p id="dexa-center-error" aria-live="polite" className="text-risk-high dark:text-red-300 empty:hidden">
            {centerError}
          </p>
          <button
            type="submit"
            className="min-h-12 rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold text-lg transition-colors"
          >
            Guardar Estudio
          </button>
        </form>
    </ModalDialog>
  );
}
