import { afterEach, describe, expect, it, vi } from "vitest";
import { ANDROID_APP_ID } from "./appIdentity";

/** capacitor.config.ts se evalúa al importarlo: el entorno se fija antes. */
async function loadCapacitorConfig(env: Record<string, string>) {
  vi.resetModules();
  Object.entries(env).forEach(([name, value]) => vi.stubEnv(name, value));
  return (await import("../../../capacitor.config")).default;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("app identity", () => {
  it("uses the same Android package name as capacitor.config.ts", async () => {
    const config = await loadCapacitorConfig({ CAP_ENV: "dev" });
    expect(config.appId).toBe(ANDROID_APP_ID);
  });

  it("bakes an https server without cleartext in release", async () => {
    const config = await loadCapacitorConfig({ CAP_ENV: "release", CAP_SERVER_URL: "https://app.ejemplo.pe" });
    expect(config.server).toMatchObject({ url: "https://app.ejemplo.pe/", cleartext: false });
    expect(config.android?.allowMixedContent).toBe(false);
  });

  it("refuses to load in release without CAP_SERVER_URL", async () => {
    await expect(loadCapacitorConfig({ CAP_ENV: "release", CAP_SERVER_URL: "" })).rejects.toThrow(/CAP_SERVER_URL/);
  });
});
