import { describe, expect, it } from "vitest";
import {
  androidVersionForSdk,
  buildReadme,
  findApkIssues,
  limaDate,
  parseBadging,
  releaseFileNames,
} from "./releasePackage";

const BADGING = [
  "package: name='com.artikare.app' versionCode='200' versionName='0.2.0' platformBuildVersionName='16'",
  "sdkVersion:'24'",
  "targetSdkVersion:'36'",
  "application-label:'Artikare'",
].join("\n");

describe("releaseFileNames", () => {
  it("derives every name, the tag and the Release URL from the version", () => {
    expect(releaseFileNames("0.2.0")).toEqual({
      folder: "v0.2.0",
      apk: "artikare-v0.2.0-debug.apk",
      sha256: "artikare-v0.2.0-debug.apk.sha256",
      notes: "RELEASE-NOTES-v0.2.0.md",
      readme: "LEEME-v0.2.0.txt",
      tag: "v0.2.0",
      releaseUrl: "https://github.com/EmirDQF/CQPHARMAAPPVIRAL/releases/tag/v0.2.0",
    });
  });
});

describe("parseBadging", () => {
  it("reads package, version and SDK levels from aapt dump badging", () => {
    expect(parseBadging(BADGING)).toEqual({
      packageName: "com.artikare.app",
      versionName: "0.2.0",
      versionCode: 200,
      minSdk: 24,
      targetSdk: 36,
    });
  });

  it("throws when the output is not aapt badging", () => {
    expect(() => parseBadging("ERROR: dump failed")).toThrow(/aapt/);
  });
});

describe("findApkIssues", () => {
  it("accepts an APK built from package.json", () => {
    expect(findApkIssues(parseBadging(BADGING), "0.2.0")).toEqual([]);
  });

  it("flags a stale APK whose version or code does not match package.json", () => {
    const issues = findApkIssues(parseBadging(BADGING), "0.3.0");
    expect(issues.join("\n")).toMatch(/versionName/);
    expect(issues.join("\n")).toMatch(/versionCode/);
  });

  it("flags a different package name", () => {
    const other = { ...parseBadging(BADGING), packageName: "com.otra.app" };
    expect(findApkIssues(other, "0.2.0").join("\n")).toMatch(/com\.artikare\.app/);
  });
});

describe("androidVersionForSdk", () => {
  it("names the minimum Android version", () => {
    expect(androidVersionForSdk(24)).toBe("Android 7.0");
    expect(androidVersionForSdk(99)).toBe("API 99");
  });
});

describe("limaDate", () => {
  it("uses America/Lima, not UTC", () => {
    expect(limaDate(new Date("2026-10-18T03:30:00Z"))).toBe("2026-10-17");
  });
});

describe("buildReadme", () => {
  const readme = buildReadme({
    version: "0.2.0",
    versionCode: 200,
    minSdk: 24,
    date: "2026-10-17",
    sha256: "b7ed0c87",
  });

  it("states version, build, debug type and where to see it in the app", () => {
    expect(readme).toContain("VERSIÓN: 0.2.0 (build 200)");
    expect(readme).toMatch(/depuración/);
    expect(readme).toMatch(/NO sirve para Google Play/);
    expect(readme).toContain("Ajustes → Acerca de");
    expect(readme).toContain("Android 7.0");
  });

  it("carries the medical, guest-mode and verification notices", () => {
    expect(readme).toContain("Contenido médico pendiente de validación del médico del proyecto");
    expect(readme).toMatch(/modo invitado/);
    expect(readme).toContain("Get-FileHash -Algorithm SHA256");
    expect(readme).toContain("adb install -r artikare-v0.2.0-debug.apk");
    expect(readme).toContain("b7ed0c87");
    expect(readme).toContain("https://github.com/EmirDQF/CQPHARMAAPPVIRAL/releases/tag/v0.2.0");
  });
});
