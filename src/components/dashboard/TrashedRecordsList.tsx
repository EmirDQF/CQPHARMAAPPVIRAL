"use client";

import { restoreDeadline, type TrashedRecord } from "@/lib/storage/trash";
import { toLimaIsoDate } from "@/lib/utils/date";
import { describeTrashedRecord, formatIsoDateForDisplay } from "./recordLabels";

interface TrashedRecordsListProps {
  items: readonly TrashedRecord[];
  onRestore: (trashId: string) => void;
}

export function TrashedRecordsList({ items, onRestore }: TrashedRecordsListProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-lg font-bold">Borrados recientemente</h3>
      <ul className="flex flex-col gap-2">
        {items.map((item) => {
          const label = describeTrashedRecord(item);
          const deadline = formatIsoDateForDisplay(toLimaIsoDate(restoreDeadline(item)));
          return (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 px-4 py-3"
            >
              <span>
                {label}
                <span className="block text-sm text-neutral-500">Puedes deshacerlo hasta el {deadline}</span>
              </span>
              <button
                type="button"
                onClick={() => onRestore(item.id)}
                aria-label={`Deshacer el borrado: ${label}`}
                className="min-h-12 shrink-0 rounded-xl border-2 border-brand text-brand font-semibold px-4"
              >
                Deshacer
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
