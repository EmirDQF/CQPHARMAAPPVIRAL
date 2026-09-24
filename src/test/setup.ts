import { afterEach } from "vitest";

afterEach(async () => {
  if (typeof window === "undefined") return;
  const { cleanup } = await import("@testing-library/react");
  cleanup();
  window.localStorage.clear();
});
