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
 */
export function createPersistentStore<T>(
  storageKey: string,
  emptyValue: T
): PersistentStore<T> {
  const { subscribe, notify } = createListenerSet();

  let hasCachedSnapshot = false;
  let cachedSnapshot: T = emptyValue;

  function readFromStorage(): T {
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as T) : emptyValue;
    } catch {
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
