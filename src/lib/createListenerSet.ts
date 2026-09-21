type Listener = () => void;

export function createListenerSet() {
  const listeners = new Set<Listener>();

  return {
    subscribe(listener: Listener): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    notify(): void {
      listeners.forEach((listener) => listener());
    },
  };
}
