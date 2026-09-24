import { createListenerSet } from "../createListenerSet";

export interface PersistentStore<T> {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  write: (value: T) => void;
}

/**
 * Fábrica de stores respaldados por localStorage, compatibles con
 * useSyncExternalStore. Centraliza el patrón de lectura cacheada +
 * notificación que antes se repetía en cada módulo de dashboard/.
 *
 * `parse` valida/migra lo leído de localStorage. Si devuelve null, se usa
 * `emptyValue` sin sobrescribir el dato guardado (para no perderlo).
 */
export function createPersistentStore<T>(
  storageKey: string,
  emptyValue: T,
  parse?: (raw: unknown) => T | null
): PersistentStore<T> {
  const { subscribe, notify } = createListenerSet();

  let hasCachedSnapshot = false;
  let cachedSnapshot: T = emptyValue;

  function readFromStorage(): T {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return emptyValue;
      const stored: unknown = JSON.parse(raw);
      if (!parse) return stored as T;
      const parsed = parse(stored);
      if (parsed === null) {
        console.error(`[storage] ${storageKey} tiene un formato inválido; se usa el valor vacío`);
        return emptyValue;
      }
      return parsed;
    } catch (error) {
      // JSON corrupto o localStorage no disponible (modo privado).
      console.error(`[storage] no se pudo leer ${storageKey}`, error);
      return emptyValue;
    }
  }

  function getSnapshot(): T {
    if (!hasCachedSnapshot) {
      cachedSnapshot = readFromStorage();
      hasCachedSnapshot = true;
    }
    return cachedSnapshot;
  }

  function getServerSnapshot(): T {
    return emptyValue;
  }

  function write(value: T): void {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Sin almacenamiento persistente disponible (modo privado, cuota
      // excedida, etc.): el cambio queda solo en memoria para esta sesión.
    }
    cachedSnapshot = value;
    hasCachedSnapshot = true;
    notify();
  }

  return { subscribe, getSnapshot, getServerSnapshot, write };
}
