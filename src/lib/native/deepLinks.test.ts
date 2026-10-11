import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SHAREABLE_PATH_PREFIXES, resolveDeepLink } from "./deepLinks";

const SITE = "https://artikare.com";

describe("App Links del manifest de Android", () => {
  it("declara exactamente las rutas compartibles, con verificación automática", () => {
    const manifest = readFileSync(join(process.cwd(), "android/app/src/main/AndroidManifest.xml"), "utf8");
    const declared = [...manifest.matchAll(/android:pathPrefix="([^"]+)"/g)].map(([, prefix]) => prefix);

    expect(declared).toEqual([...SHAREABLE_PATH_PREFIXES]);
    expect(manifest).toContain('<intent-filter android:autoVerify="true">');
  });
});

describe("resolveDeepLink", () => {
  it("opens shareable paths of our own domain", () => {
    expect(resolveDeepLink("https://artikare.com/test", SITE)).toBe("/test");
    expect(resolveDeepLink("https://artikare.com/blog/mito-gelatina", SITE)).toBe("/blog/mito-gelatina");
  });

  it("keeps only known UTM parameters with simple values", () => {
    expect(
      resolveDeepLink(
        "https://artikare.com/test?utm_source=whatsapp&utm_campaign=derivacion-familiar&email=a@b.pe&utm_medium=<x>",
        SITE
      )
    ).toBe("/test?utm_source=whatsapp&utm_campaign=derivacion-familiar");
  });

  it.each([
    ["another host", "https://artikare.com.evil.pe/test"],
    ["plain http", "http://artikare.com/test"],
    ["credentials", "https://user:pass@artikare.com/test"],
    ["a private screen", "https://artikare.com/app/reporte-medico"],
    ["a lookalike prefix", "https://artikare.com/testigo"],
    ["a custom scheme", "artikare://test"],
    ["garbage", "no es una url"],
    ["a non-string", 42],
  ])("ignores %s", (_label, raw) => {
    expect(resolveDeepLink(raw, SITE)).toBeNull();
  });
});
