"use client";

import { useState } from "react";
import type { AuthStatus } from "@/lib/auth/types";
import { buildPersonalDataExport, personalDataExportFileName, readLocalPersonalData } from "@/lib/privacy/arco";
import { fetchAccountExport, hasServerSession } from "@/lib/privacy/arcoRequests";
import { downloadFile } from "@/lib/utils/downloadFile";
import { SettingsCard } from "./SettingsCard";

type ExportStatus = "idle" | "working" | "done" | "partial";

interface DataExportSectionProps {
  authStatus: AuthStatus;
}

interface BuiltExport {
  json: string;
  isComplete: boolean;
}

async function buildExport(authStatus: AuthStatus): Promise<BuiltExport> {
  const local = readLocalPersonalData(window.localStorage);
  const accountResult = hasServerSession(authStatus) ? await fetchAccountExport() : null;
  const account = accountResult?.ok ? accountResult.data : null;
  const exported = buildPersonalDataExport({ local, account, now: new Date() });
  return { json: JSON.stringify(exported, null, 2), isComplete: accountResult === null || accountResult.ok };
}

const STATUS_MESSAGE: Record<Exclude<ExportStatus, "idle" | "working">, string> = {
  done: "Listo: tus datos están en el archivo descargado.",
  partial:
    "Descargamos los datos de este celular, pero no pudimos traer los de tu cuenta. Revisa tu conexión e inténtalo de nuevo.",
};

/** Derecho de acceso: todo lo que Artikare guarda, en un JSON legible. */
export function DataExportSection({ authStatus }: DataExportSectionProps) {
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const isWorking = status === "working" || authStatus === "loading";

  async function handleDownload() {
    setStatus("working");
    const { json, isComplete } = await buildExport(authStatus);
    downloadFile(personalDataExportFileName(), json, "application/json;charset=utf-8");
    setStatus(isComplete ? "done" : "partial");
  }

  async function handleTogglePreview() {
    if (preview !== null) {
      setPreview(null);
      return;
    }
    setStatus("working");
    const { json, isComplete } = await buildExport(authStatus);
    setPreview(json);
    setStatus(isComplete ? "idle" : "partial");
  }

  return (
    <SettingsCard
      id="ajustes-acceso"
      title="Descargar mis datos"
      description="Derecho de acceso: obtén una copia de todo lo que Artikare guarda de ti, en este celular y en tu cuenta si la tienes."
    >
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isWorking}
          className="min-h-12 rounded-xl bg-action-strong text-white font-semibold px-5 disabled:opacity-60"
        >
          {status === "working" ? "Preparando…" : "Descargar mis datos (JSON)"}
        </button>
        <button
          type="button"
          onClick={handleTogglePreview}
          disabled={isWorking}
          aria-expanded={preview !== null}
          className="min-h-12 rounded-xl border-2 border-brand text-clinic font-semibold px-5 disabled:opacity-60"
        >
          {preview === null ? "Ver mis datos aquí" : "Ocultar mis datos"}
        </button>
      </div>
      {(status === "done" || status === "partial") && (
        <p role="status" className="text-base font-medium">
          {STATUS_MESSAGE[status]}
        </p>
      )}
      {preview !== null && (
        <pre
          aria-label="Mis datos en formato JSON"
          tabIndex={0}
          className="max-h-80 overflow-auto rounded-xl bg-neutral-100 dark:bg-neutral-900 p-3 text-xs whitespace-pre-wrap break-all"
        >
          {preview}
        </pre>
      )}
    </SettingsCard>
  );
}
