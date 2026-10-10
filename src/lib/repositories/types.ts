/**
 * Contratos del Repository Pattern (C3). Cada dominio tiene un adaptador local
 * (stores `artikare_*_v1`, fuente de la UI) y uno de Supabase (con RLS). El
 * motor de sincronización solo conoce estas interfaces.
 */

/** Registro identificado por su clave natural: la misma UNIQUE de la base. */
export interface SyncRecord<T> {
  key: string;
  value: T;
  /** Última edición (ISO). null = desconocida (registros previos a C3): pierde ante cualquier fecha. */
  updatedAt: string | null;
}

export interface RecordRepository<T> {
  list(): Promise<SyncRecord<T>[]>;
  /** Crea o reemplaza por clave natural; repetirlo con los mismos datos no cambia nada. */
  upsertMany(values: readonly T[]): Promise<void>;
}

/** Dominios con borrado (suave en la base, a la papelera en el celular). */
export interface DeletableRecordRepository<T> extends RecordRepository<T> {
  deleteMany(keys: readonly string[]): Promise<void>;
}

/** Fallo de un repositorio. El mensaje nunca lleva valores clínicos, solo la operación. */
export class RepositoryError extends Error {
  constructor(operation: string, options?: { cause?: unknown }) {
    super(`[repositorio] ${operation} falló`, options);
    this.name = "RepositoryError";
  }
}
