import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { findVersionIssues, formatAppVersionLabel, parseAppVersion, versionCodeFor } from "./appVersion";

const GRADLE = readFileSync("android/app/build.gradle", "utf8");
const CAPACITOR = readFileSync("capacitor.config.ts", "utf8");
const PACKAGE_VERSION = (JSON.parse(readFileSync("package.json", "utf8")) as { version: string }).version;

describe("parseAppVersion", () => {
  it("reads major, minor and patch from SemVer", () => {
    expect(parseAppVersion("0.2.0")).toEqual({ major: 0, minor: 2, patch: 0 });
  });

  it("rejects pre-release tags, missing parts and parts above 99", () => {
    expect(() => parseAppVersion("0.2")).toThrow(/SemVer/);
    expect(() => parseAppVersion("0.2.0-beta")).toThrow(/SemVer/);
    expect(() => parseAppVersion("0.100.0")).toThrow(/99/);
  });
});

describe("versionCodeFor", () => {
  it("computes major*10000 + minor*100 + patch", () => {
    expect(versionCodeFor("0.2.0")).toBe(200);
    expect(versionCodeFor("1.4.7")).toBe(10407);
  });

  it("grows monotonically with every SemVer bump", () => {
    const ordered = ["0.1.0", "0.1.1", "0.1.99", "0.2.0", "0.99.99", "1.0.0", "1.0.1", "2.0.0"];
    const codes = ordered.map(versionCodeFor);
    codes.slice(1).forEach((code, index) => expect(code).toBeGreaterThan(codes[index]));
  });

  it("stays above the old hand-written versionCode 1", () => {
    expect(versionCodeFor(PACKAGE_VERSION)).toBeGreaterThan(1);
  });
});

describe("formatAppVersionLabel", () => {
  it("shows the version and build number", () => {
    expect(formatAppVersionLabel("0.2.0", "200")).toBe("Artikare v0.2.0 (build 200)");
  });

  it("does not invent a number when the build did not inject one", () => {
    expect(formatAppVersionLabel(undefined, undefined)).toBe("Artikare (versión de desarrollo)");
  });
});

describe("findVersionIssues", () => {
  it("accepts the current package.json, build.gradle and capacitor.config.ts", () => {
    expect(findVersionIssues({ packageVersion: PACKAGE_VERSION, buildGradle: GRADLE, capacitorConfig: CAPACITOR })).toEqual([]);
  });

  it("flags a hand-written versionCode or versionName in build.gradle", () => {
    const handWritten = GRADLE.replace(/versionCode \S+/, "versionCode 1").replace(/versionName \S+/, 'versionName "1.0"');
    const issues = findVersionIssues({ packageVersion: PACKAGE_VERSION, buildGradle: handWritten, capacitorConfig: CAPACITOR });
    expect(issues.join("\n")).toMatch(/versionCode/);
    expect(issues.join("\n")).toMatch(/versionName/);
  });

  it("flags a version declared in capacitor.config.ts", () => {
    const issues = findVersionIssues({
      packageVersion: PACKAGE_VERSION,
      buildGradle: GRADLE,
      capacitorConfig: `${CAPACITOR}\nconst x = { version: "9.9.9" };`,
    });
    expect(issues.join("\n")).toMatch(/capacitor\.config\.ts/);
  });

  it("compares the built APK metadata when present", () => {
    const stale = { versionName: "1.0", versionCode: 1 };
    const issues = findVersionIssues({ packageVersion: "0.2.0", buildGradle: GRADLE, capacitorConfig: CAPACITOR, builtApk: stale });
    expect(issues).toHaveLength(2);
    expect(
      findVersionIssues({
        packageVersion: "0.2.0",
        buildGradle: GRADLE,
        capacitorConfig: CAPACITOR,
        builtApk: { versionName: "0.2.0", versionCode: 200 },
      })
    ).toEqual([]);
  });
});
