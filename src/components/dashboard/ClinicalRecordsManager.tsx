"use client";

import { useState, useSyncExternalStore } from "react";
import { isPartOfSeverePainStreak, isRedFlagDexaScan } from "@/lib/clinical/redFlags";
import { dexaVaultStore, selectValidDexaEntries } from "@/lib/dashboard/dexaVault";
import { painLogStore } from "@/lib/dashboard/painLog";
import {
  restoreTrashedRecord,
  softDeleteDexaScan,
  softDeletePainLog,
  type RestoreResult,
} from "@/lib/dashboard/recordDeletion";
import { selectLast30DaysEntries } from "@/lib/storage/clinicalReport";
import type { PersistentStore } from "@/lib/storage/persistentStore";
import { selectRestorableRecords, trashStore } from "@/lib/storage/trash";
import { RecordDeleteDialog } from "./RecordDeleteDialog";
import { describeDexaScan, describePainLog } from "./recordLabels";
import { TrashedRecordsList } from "./TrashedRecordsList";

export const RED_FLAG_DELETE_WARNING =
  "Este registro es importante para tu reumatólogo. ¿Seguro que quieres borrarlo?";

const DELETED_MESSAGE = "Registro borrado. Puedes deshacerlo durante 30 días.";

const RESTORE_MESSAGE: Record<RestoreResult, string> = {
  restored: "Registro recuperado.",
  expired: "Pasaron más de 30 días: este registro ya no se puede recuperar.",
  "not-found": "No encontramos ese registro. Es posible que ya se haya recuperado.",
  conflict: "Ya registraste otro dato en esa fecha, así que se conserva el más reciente.",
};

interface PendingDeletion {
  label: string;
  remove: () => void;
}

function useStore<T>(store: PersistentStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

/** "Mis registros": borrar (en suave) y deshacer durante 30 días. */
export function ClinicalRecordsManager() {
  const scans = selectValidDexaEntries(useStore(dexaVaultStore));
  const painEntries = useStore(painLogStore);
  const trash = useStore(trashStore);
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const now = new Date();
  const recentPain = [...selectLast30DaysEntries(painEntries, now)].reverse();
  const restorable = selectRestorableRecords(trash, now);
  const hasRecords = scans.length > 0 || recentPain.length > 0;

  function requestDeletion(label: string, isRedFlag: boolean, remove: () => void) {
    if (isRedFlag) {
      setPendingDeletion({ label, remove });
      return;
    }
    remove();
    setStatusMessage(DELETED_MESSAGE);
  }

  function confirmDeletion() {
    pendingDeletion?.remove();
    setPendingDeletion(null);
    setStatusMessage(DELETED_MESSAGE);
  }

  function handleRestore(trashId: string) {
    setStatusMessage(RESTORE_MESSAGE[restoreTrashedRecord(trashId)]);
  }

  return (
    <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 px-6 py-6 flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">Mis registros</h2>
        <p className="text-sm text-neutral-500">
          Si te equivocaste al registrar algo, puedes borrarlo y deshacerlo durante 30 días.
        </p>
      </div>

      {!hasRecords && (
        <p className="text-neutral-500">Aún no tienes registros de densitometría ni de dolor.</p>
      )}

      <ul className="flex flex-col gap-2">
        {scans.map((scan) => {
          const label = describeDexaScan(scan);
          return (
            <RecordRow
              key={scan.id}
              label={label}
              actionLabel={`Borrar densitometría del ${scan.date}`}
              onDelete={() =>
                requestDeletion(label, isRedFlagDexaScan(scan), () => softDeleteDexaScan(scan.id))
              }
            />
          );
        })}
        {recentPain.map((entry) => {
          const label = describePainLog(entry);
          return (
            <RecordRow
              key={entry.date}
              label={label}
              actionLabel={`Borrar registro de dolor del ${entry.date}`}
              onDelete={() =>
                requestDeletion(label, isPartOfSeverePainStreak(entry, painEntries, now), () =>
                  softDeletePainLog(entry.date)
                )
              }
            />
          );
        })}
      </ul>

      {statusMessage && (
        <p role="status" className="rounded-xl bg-brand-light/60 dark:bg-brand-dark/20 px-4 py-3 font-medium">
          {statusMessage}
        </p>
      )}

      <TrashedRecordsList items={restorable} onRestore={handleRestore} />

      {pendingDeletion && (
        <RecordDeleteDialog
          warning={RED_FLAG_DELETE_WARNING}
          recordLabel={pendingDeletion.label}
          onConfirm={confirmDeletion}
          onCancel={() => setPendingDeletion(null)}
        />
      )}
    </section>
  );
}

function RecordRow({
  label,
  actionLabel,
  onDelete,
}: {
  label: string;
  actionLabel: string;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-3">
      <span>{label}</span>
      <button
        type="button"
        onClick={onDelete}
        aria-label={actionLabel}
        className="min-h-12 shrink-0 rounded-xl border-2 border-neutral-300 dark:border-neutral-600 font-semibold px-4"
      >
        Borrar
      </button>
    </li>
  );
}
