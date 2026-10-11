import { describe, expect, it } from "vitest";
import { buildAssetLinks, parseAndroidFingerprints } from "./assetLinks";

// Huellas sintéticas con el formato correcto (32 bytes); no corresponden a ningún certificado.
const FINGERPRINT_A = Array.from({ length: 32 }, () => "AB").join(":");
const FINGERPRINT_B = Array.from({ length: 32 }, (_, index) => index.toString(16).padStart(2, "0")).join(":");

describe("parseAndroidFingerprints", () => {
  it("accepts several comma-separated fingerprints, normalized to uppercase and deduplicated", () => {
    expect(parseAndroidFingerprints(` ${FINGERPRINT_A} ,${FINGERPRINT_B.toLowerCase()},${FINGERPRINT_A}`)).toEqual([
      FINGERPRINT_A,
      FINGERPRINT_B.toUpperCase(),
    ]);
  });

  it.each([
    ["missing", undefined],
    ["empty", " , "],
    ["too short", FINGERPRINT_A.slice(0, -3)],
    ["not hex", FINGERPRINT_A.replace("AB", "ZZ")],
    ["one invalid among valid ones", `${FINGERPRINT_A},nope`],
  ])("rejects a %s value instead of publishing a partial list", (_label, raw) => {
    expect(parseAndroidFingerprints(raw)).toBeNull();
  });
});

describe("buildAssetLinks", () => {
  it("builds the standard Google statement for the app package", () => {
    expect(buildAssetLinks("com.artikare.app", [FINGERPRINT_A])).toEqual([
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "com.artikare.app",
          sha256_cert_fingerprints: [FINGERPRINT_A],
        },
      },
    ]);
  });

  it("publishes an empty list without fingerprints, never an invented one", () => {
    expect(buildAssetLinks("com.artikare.app", null)).toEqual([]);
    expect(buildAssetLinks("com.artikare.app", [])).toEqual([]);
  });
});
