import {
  CONTROL_MONTHS_DEFAULT,
  CONTROL_MONTHS_OSTEOPOROSIS,
  T_SCORE_INPUT_MAX,
  T_SCORE_INPUT_MIN,
  WHO_T_SCORE_NORMAL_MIN,
  WHO_T_SCORE_OSTEOPOROSIS_MAX,
} from "../clinical/constants";
import {
  INTERPRETATION_NOTE,
  Z_SCORE_REQUIRED_LABEL,
  getBoneDensityInterpretation,
  type BoneDensityPatient,
} from "../clinical/tScoreEligibility";
import { createPersistentStore } from "../storage/persistentStore";
import { discardTrashedRecordsFor } from "../storage/trash";
import type { RiskLevel } from "../types";
import type { BoneScanSummary } from "./types";

export interface DexaScanEntry {
  id: string;
  date: string;
  lumbarTScore: number;
  femoralNeckTScore: number;
  radiologyCenter: string;
}

/** Un valor que no es lista no se usa (ni se sobrescribe); las entradas inválidas se filtran al leer. */
export function parseStoredDexaEntries(raw: unknown): DexaScanEntry[] | null {
  return Array.isArray(raw) ? (raw as DexaScanEntry[]) : null;
}

const store = createPersistentStore<DexaScanEntry[]>(
  "artikare_dexa_vault_v1",
  [],
  parseStoredDexaEntries
);

/** Clasificación OMS: Normal T ≥ -1.0 · Osteopenia -2.5 < T < -1.0 · Osteoporosis T ≤ -2.5. */
export function classifyTScore(tScore: number): RiskLevel {
  if (tScore >= WHO_T_SCORE_NORMAL_MIN) return "bajo";
  if (tScore > WHO_T_SCORE_OSTEOPOROSIS_MAX) return "moderado";
  return "alto";
}

const DIAGNOSIS_LABEL: Record<RiskLevel, string> = {
  bajo: "Densidad Ósea Normal",
  moderado: "Osteopenia",
  alto: "Osteoporosis",
};

const DIAGNOSIS_MESSAGE: Record<RiskLevel, string> = {
  bajo: "Tu densidad ósea está en rango normal. Mantén tu protocolo preventivo y actividad de fuerza.",
  moderado:
    "Tu médico definirá el tratamiento. El Citrato de Magnesio + D3 puede complementar tu tratamiento y apoyar tu salud ósea.",
  alto: "Requiere seguimiento reumatológico. Consulta con tu reumatólogo antes de iniciar o cambiar cualquier suplemento.",
};

// Con cualquier bandera roja activa, el mensaje prioriza al reumatólogo sobre cualquier suplemento.
const RED_FLAG_DIAGNOSIS_MESSAGE = DIAGNOSIS_MESSAGE.alto;

const Z_SCORE_MESSAGE =
  "Por tu edad o estado hormonal, este estudio se interpreta con Z-score. Tu médico definirá qué significa tu resultado y los siguientes pasos.";

const T_SCORE_INPUT_PATTERN = /^[-+]?\d{1,2}(\.\d{1,2})?$/;
// Signo menos Unicode (U+2212) y guiones en/em que aparecen al copiar desde un PDF.
const MINUS_LIKE_CHARACTERS = /[−–—]/g;

export type TScoreInputResult = { ok: true; value: number } | { ok: false; error: string };

/** Valida un T-score tecleado por el paciente (acepta coma decimal, rechaza valores imposibles). */
export function parseTScoreInput(raw: string): TScoreInputResult {
  const normalized = raw.trim().replace(MINUS_LIKE_CHARACTERS, "-").replace(",", ".");
  if (!T_SCORE_INPUT_PATTERN.test(normalized)) {
    return { ok: false, error: "Ingresa un número como -1.6" };
  }
  const value = Number(normalized);
  if (value < T_SCORE_INPUT_MIN || value > T_SCORE_INPUT_MAX) {
    return {
      ok: false,
      error: `El T-score debe estar entre ${T_SCORE_INPUT_MIN.toFixed(1)} y +${T_SCORE_INPUT_MAX.toFixed(1)}. Revisa tu informe.`,
    };
  }
  return { ok: true, value };
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Devuelve un mensaje de error o null. `todayIso` es la fecha de hoy en Lima. */
export function validateScanDate(scanDate: string, todayIso: string): string | null {
  if (!ISO_DATE_PATTERN.test(scanDate)) return "Ingresa la fecha del estudio";
  if (scanDate > todayIso) return "La fecha del estudio no puede ser futura";
  return null;
}

function isPlausibleTScore(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= T_SCORE_INPUT_MIN &&
    value <= T_SCORE_INPUT_MAX
  );
}

/** Descarta entradas corruptas de localStorage: un NaN mostraría "Osteoporosis" sin bandera roja. */
function isValidDexaEntry(entry: DexaScanEntry): boolean {
  return (
    typeof entry.date === "string" &&
    ISO_DATE_PATTERN.test(entry.date) &&
    isPlausibleTScore(entry.lumbarTScore) &&
    isPlausibleTScore(entry.femoralNeckTScore)
  );
}

/** Solo los estudios con fecha y T-scores plausibles (para resumen y gráficas). */
export function selectValidDexaEntries(entries: readonly DexaScanEntry[]): DexaScanEntry[] {
  return entries.filter(isValidDexaEntry);
}

function worstTScoreOf(entry: DexaScanEntry): number {
  return Math.min(entry.lumbarTScore, entry.femoralNeckTScore);
}

export function addDexaScanEntry(entry: Omit<DexaScanEntry, "id">): void {
  discardTrashedRecordsFor("dexa", entry.date);
  const id = `dexa-${Date.now()}`;
  const updated = [...store.getSnapshot(), { ...entry, id }].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  store.write(updated);
}

/**
 * Deriva el resumen del semáforo óseo a partir del estudio DEXA más
 * reciente, usando siempre el peor de los dos T-Score (lumbar / cuello
 * femoral). Devuelve null si el paciente no registró ningún estudio: nunca
 * se muestra un T-score que el paciente no haya cargado. Con una bandera roja
 * activa (`hasRedFlag`), el mensaje prioriza la evaluación reumatológica sobre
 * cualquier suplemento.
 */
export function buildBoneScanSummaryFromEntries(
  entries: DexaScanEntry[],
  {
    hasRedFlag = false,
    patient = { age: null, sex: null, menopausalStatus: null },
  }: { hasRedFlag?: boolean; patient?: BoneDensityPatient } = {}
): BoneScanSummary | null {
  const validEntries = selectValidDexaEntries(entries);
  if (validEntries.length === 0) return null;

  const latest = validEntries[validEntries.length - 1];
  const worst = worstTScoreOf(latest);
  const interpretation = getBoneDensityInterpretation(patient);

  if (interpretation === "z-score-required") {
    return {
      interpretation,
      scanDate: latest.date,
      worstTScore: worst,
      riskLevel: null,
      diagnosisLabel: Z_SCORE_REQUIRED_LABEL,
      diagnosisMessage: hasRedFlag ? RED_FLAG_DIAGNOSIS_MESSAGE : Z_SCORE_MESSAGE,
      profileNote: null,
      // Valor bajo sin etiqueta OMS: mismo control estrecho que la osteoporosis.
      nextControlMonths:
        worst <= WHO_T_SCORE_OSTEOPOROSIS_MAX ? CONTROL_MONTHS_OSTEOPOROSIS : CONTROL_MONTHS_DEFAULT,
    };
  }

  const riskLevel = classifyTScore(worst);
  return {
    interpretation,
    scanDate: latest.date,
    worstTScore: worst,
    riskLevel,
    diagnosisLabel: DIAGNOSIS_LABEL[riskLevel],
    diagnosisMessage: hasRedFlag ? RED_FLAG_DIAGNOSIS_MESSAGE : DIAGNOSIS_MESSAGE[riskLevel],
    profileNote: INTERPRETATION_NOTE[interpretation],
    nextControlMonths:
      riskLevel === "alto" ? CONTROL_MONTHS_OSTEOPOROSIS : CONTROL_MONTHS_DEFAULT,
  };
}

export const dexaVaultStore = store;
