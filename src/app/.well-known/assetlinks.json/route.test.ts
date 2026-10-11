import { afterEach, describe, expect, it, vi } from "vitest";
import { ANDROID_APP_ID } from "@/lib/native/appIdentity";
import { ASSET_LINKS_CACHE_CONTROL } from "@/lib/native/assetLinks";
import { GET } from "./route";

const FINGERPRINT = Array.from({ length: 32 }, () => "AB").join(":");

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /.well-known/assetlinks.json", () => {
  it("publishes the app package with the configured fingerprint", async () => {
    vi.stubEnv("ANDROID_SHA256_FINGERPRINT", FINGERPRINT);

    const response = GET();

    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("Cache-Control")).toBe(ASSET_LINKS_CACHE_CONTROL.configured);
    await expect(response.json()).resolves.toEqual([
      expect.objectContaining({
        target: expect.objectContaining({ package_name: ANDROID_APP_ID, sha256_cert_fingerprints: [FINGERPRINT] }),
      }),
    ]);
  });

  it("answers [] with a short cache when the fingerprint is missing or invalid", async () => {
    for (const value of ["", "AB:CD"]) {
      vi.stubEnv("ANDROID_SHA256_FINGERPRINT", value);
      const response = GET();

      expect(response.headers.get("Cache-Control")).toBe(ASSET_LINKS_CACHE_CONTROL.missing);
      await expect(response.json()).resolves.toEqual([]);
    }
  });
});
