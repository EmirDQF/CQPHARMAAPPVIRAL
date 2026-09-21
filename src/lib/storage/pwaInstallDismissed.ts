import { createPersistentStore } from "./persistentStore";

const store = createPersistentStore<boolean>(
  "artikare_pwa_install_dismissed_v1",
  false
);

export function dismissPwaInstallPrompt(): void {
  store.write(true);
}

export const pwaInstallDismissedStore = store;
