import { toLimaIsoDate } from "../utils/date";
import { CONSENT_VERSION } from "./consent";

/**
 * Derechos ARCO (Ley 29733) del lado del celular: acceso (exportar todo lo
 * que Artikare guarda aquí, en JSON legible) y cancelación (borrarlo).
 * Lo de la cuenta lo entregan /api/arco/export y /api/arco/delete.
 */

const LOCAL_DATA_PREFIX = "artikare_";

/** Nombre legible de cada clave local; las que no estén aquí salen con su nombre técnico. */
const LOCAL_SECTION_NAMES: Readonly<Record<string, string>> = {
  artikare_patient_profile_v1: "perfilMedico",
  artikare_pain_log_v1: "diarioDeDolorYRigidez",
  artikare_dexa_vault_v1: "densitometrias",
  artikare_pillbox_v1: "tomasRegistradas",
  artikare_bottles_v1: "frascos",
  artikare_appointments_v1: "citas",
  artikare_test_store_v1: "testDeEdadArticular",
  artikare_pending_assessment_v1: "testPendienteDeEnvio",
  artikare_trash_v1: "papelera",
  artikare_outbox_v1: "enviosPendientes",
  artikare_outbox_dead_v1: "enviosFallidos",
  artikare_account_backup_consent_v1: "autorizacionDeRespaldo",
  artikare_reminder_prompt_v1: "preferenciaDeRecordatorios",
  artikare_sync_state_v1: "estadoDelRespaldo",
  artikare_rewards_v1: "logrosDeConstancia",
  artikare_feedback_prefs_v1: "preferenciasDeVibracionYCelebraciones",
};

const EXPORT_NOTICE =
  "Copia de tus datos en Artikare (derecho de acceso, Ley 29733). Es informativa y no reemplaza el consejo de tu médico.";

type LocalStorageReader = Pick<Storage, "length" | "key" | "getItem">;
type LocalStorageWriter = LocalStorageReader & Pick<Storage, "removeItem">;

export interface PersonalDataExport {
  formato: "artikare-mis-datos-v1";
  generadoEl: string;
  versionDePolitica: string;
  aviso: string;
  enEsteCelular: Record<string, unknown>;
  enTuCuenta: Record<string, unknown> | null;
}

function artikareKeys(storage: LocalStorageReader): string[] {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(LOCAL_DATA_PREFIX)) keys.push(key);
  }
  return keys.sort();
}

function parseStoredValue(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/** Todo lo que Artikare guarda en este celular, con nombres legibles. */
export function readLocalPersonalData(storage: LocalStorageReader): Record<string, unknown> {
  return Object.fromEntries(
    artikareKeys(storage).flatMap((key) => {
      const raw = storage.getItem(key);
      return raw === null ? [] : [[LOCAL_SECTION_NAMES[key] ?? key, parseStoredValue(raw)]];
    })
  );
}

interface PersonalDataExportInput {
  local: Record<string, unknown>;
  account: Record<string, unknown> | null;
  now: Date;
}

export function buildPersonalDataExport({ local, account, now }: PersonalDataExportInput): PersonalDataExport {
  return {
    formato: "artikare-mis-datos-v1",
    generadoEl: now.toISOString(),
    versionDePolitica: CONSENT_VERSION,
    aviso: EXPORT_NOTICE,
    enEsteCelular: local,
    enTuCuenta: account,
  };
}

/** Solo la fecha de Lima: el nombre del archivo nunca lleva datos personales. */
export function personalDataExportFileName(now: Date = new Date()): string {
  return `artikare-mis-datos-${toLimaIsoDate(now)}.json`;
}

/**
 * Marca de "borrado hecho" en sessionStorage (no en la URL ni en
 * localStorage): tras borrar se recarga la página para que ningún store en
 * memoria vuelva a escribir lo borrado, y la marca muestra la confirmación.
 */
const DELETION_DONE_FLAG = "artikare-borrado-confirmado";

export function markLocalDeletionDone(session: Pick<Storage, "setItem">): void {
  try {
    session.setItem(DELETION_DONE_FLAG, "1");
  } catch {
    // Sin sessionStorage solo se pierde el mensaje de confirmación, no el borrado.
  }
}

export function consumeLocalDeletionDone(session: Pick<Storage, "getItem" | "removeItem">): boolean {
  try {
    const wasDone = session.getItem(DELETION_DONE_FLAG) === "1";
    if (wasDone) session.removeItem(DELETION_DONE_FLAG);
    return wasDone;
  } catch {
    return false;
  }
}

/** Borra todas las claves de Artikare de este celular. Devuelve cuántas borró. */
export function clearLocalPersonalData(storage: LocalStorageWriter): number {
  const keys = artikareKeys(storage);
  keys.forEach((key) => storage.removeItem(key));
  return keys.length;
}
