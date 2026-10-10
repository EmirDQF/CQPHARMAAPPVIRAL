import type { SyncRecord } from "../repositories/types";

/**
 * Motor de sincronización puro (sin E/S): fusión a tres vías por clave entre
 * la base (lo último confirmado en ambos lados), el celular y la cuenta.
 *
 * Reglas (docs/plans/fase-1-supabase.md, C3, y decisión del usuario 2026-10-10):
 * - `latest-updated-at` (dolor, densitometrías, perfil): si solo cambió un
 *   lado, gana ese lado; si cambiaron ambos, gana el `updatedAt` más reciente
 *   (desconocido = el más antiguo).
 * - `union` (tomas, frascos): nunca se borra; lo de cualquier lado cuenta.
 * - Una edición siempre gana a un borrado del otro lado: no se pierden datos.
 * - Sin base (primer login) nunca se infieren borrados.
 * - La base solo avanza con lo confirmado por ambos lados: lo pendiente de
 *   subir o de borrar en la cuenta conserva su base, así un envío fallido se
 *   reintenta en la próxima pasada en vez de tomarse como un borrado.
 */

export type ConflictRule = "latest-updated-at" | "union";

/** Huella de cada clave tal como quedó confirmada en ambos lados. */
export type SyncBase = Readonly<Record<string, string>>;

export interface DomainSyncInput<T> {
  local: readonly SyncRecord<T>[];
  remote: readonly SyncRecord<T>[];
  base: SyncBase;
  rule: ConflictRule;
  supportsDelete: boolean;
  /** Identidad del valor, sin `updatedAt` ni ids locales. */
  fingerprint: (value: T) => string;
}

export interface DomainSyncPlan<T> {
  applyLocal: T[];
  deleteLocal: string[];
  uploadRemote: T[];
  deleteRemote: string[];
  nextBase: Record<string, string>;
}

type KeyDecision<T> =
  | { kind: "in-sync"; fingerprint: string }
  | { kind: "apply-local"; value: T; fingerprint: string }
  | { kind: "upload"; value: T }
  | { kind: "delete-local" }
  | { kind: "delete-remote" }
  | { kind: "gone" };

/** ¿`a` es estrictamente más reciente que `b`? Una fecha desconocida es la más antigua. */
function isNewer(a: string | null, b: string | null): boolean {
  if (a === null) return false;
  if (b === null) return true;
  return Date.parse(a) > Date.parse(b);
}

function resolveBoth<T>(
  local: SyncRecord<T>,
  remote: SyncRecord<T>,
  base: string | undefined,
  fingerprint: (value: T) => string
): KeyDecision<T> {
  const localPrint = fingerprint(local.value);
  const remotePrint = fingerprint(remote.value);
  if (localPrint === remotePrint) return { kind: "in-sync", fingerprint: localPrint };
  if (base === localPrint) return { kind: "apply-local", value: remote.value, fingerprint: remotePrint };
  if (base === remotePrint) return { kind: "upload", value: local.value };
  return isNewer(local.updatedAt, remote.updatedAt)
    ? { kind: "upload", value: local.value }
    : { kind: "apply-local", value: remote.value, fingerprint: remotePrint };
}

function decideKey<T>(
  local: SyncRecord<T> | undefined,
  remote: SyncRecord<T> | undefined,
  base: string | undefined,
  input: DomainSyncInput<T>
): KeyDecision<T> {
  const canDelete = input.supportsDelete && input.rule !== "union" && base !== undefined;
  if (local && remote) return resolveBoth(local, remote, base, input.fingerprint);
  if (local) {
    const unchangedSinceBase = input.fingerprint(local.value) === base;
    return canDelete && unchangedSinceBase ? { kind: "delete-local" } : { kind: "upload", value: local.value };
  }
  if (remote) {
    const remotePrint = input.fingerprint(remote.value);
    return canDelete && remotePrint === base
      ? { kind: "delete-remote" }
      : { kind: "apply-local", value: remote.value, fingerprint: remotePrint };
  }
  return { kind: "gone" };
}

function byKey<T>(records: readonly SyncRecord<T>[]): Map<string, SyncRecord<T>> {
  return new Map(records.map((record) => [record.key, record]));
}

export function planDomainSync<T>(input: DomainSyncInput<T>): DomainSyncPlan<T> {
  const local = byKey(input.local);
  const remote = byKey(input.remote);
  const keys = new Set([...local.keys(), ...remote.keys(), ...Object.keys(input.base)]);
  const plan: DomainSyncPlan<T> = {
    applyLocal: [],
    deleteLocal: [],
    uploadRemote: [],
    deleteRemote: [],
    nextBase: {},
  };

  for (const key of [...keys].sort()) {
    const base = input.base[key];
    const decision = decideKey(local.get(key), remote.get(key), base, input);
    switch (decision.kind) {
      case "in-sync":
        plan.nextBase[key] = decision.fingerprint;
        break;
      case "apply-local":
        plan.applyLocal.push(decision.value);
        plan.nextBase[key] = decision.fingerprint;
        break;
      case "upload":
        plan.uploadRemote.push(decision.value);
        if (base !== undefined) plan.nextBase[key] = base;
        break;
      case "delete-remote":
        plan.deleteRemote.push(key);
        if (base !== undefined) plan.nextBase[key] = base;
        break;
      case "delete-local":
        plan.deleteLocal.push(key);
        break;
      case "gone":
        break;
    }
  }
  return plan;
}
