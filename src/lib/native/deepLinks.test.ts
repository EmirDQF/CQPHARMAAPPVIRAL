import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { APP_URL_SCHEME, SHAREABLE_PATH_PREFIXES, resolveDeepLink } from "./deepLinks";

const SITE = "https://artikare.com";

describe("App Links del manifest de Android", () => {
  it("declara exactamente las rutas compartibles, con verificación automática", () => {
    const manifest = readFileSync(join(process.cwd(), "android/app/src/main/AndroidManifest.xml"), "utf8");
    const declared = [...manifest.matchAll(/android:pathPrefix="([^"]+)"/g)].map(([, prefix]) => prefix);

    expect(declared).toEqual([...SHAREABLE_PATH_PREFIXES]);
    expect(manifest).toContain('<intent-filter android:autoVerify="true">');
  });

  it("declara el esquema propio en un intent-filter aparte, sin autoVerify", () => {
    const manifest = readFileSync(join(process.cwd(), "android/app/src/main/AndroidManifest.xml"), "utf8");
    const filters = [...manifest.matchAll(/<intent-filter[^>]*>[\s\S]*?<\/intent-filter>/g)].map(([filter]) => filter);
    const verified = filters.filter((filter) => filter.includes('android:autoVerify="true"'));
    const custom = filters.filter((filter) => filter.includes(`android:scheme="${APP_URL_SCHEME}"`));
    const customHosts = [...(custom[0] ?? "").matchAll(/android:host="([^"]+)"/g)].map(([, host]) => `/${host}`);

    // Un esquema que no es http(s) dentro del filtro verificado haría fallar la verificación.
    expect(verified.every((filter) => !filter.includes(`android:scheme="${APP_URL_SCHEME}"`))).toBe(true);
    expect(custom).toHaveLength(1);
    expect(customHosts).toEqual([...SHAREABLE_PATH_PREFIXES]);
  });
});

describe("resolveDeepLink", () => {
  it("opens shareable paths of our own domain", () => {
    expect(resolveDeepLink("https://artikare.com/test", SITE)).toBe("/test");
    expect(resolveDeepLink("https://artikare.com/blog/mito-gelatina", SITE)).toBe("/blog/mito-gelatina");
  });

  it("opens the same shareable paths through the app's own scheme", () => {
    expect(resolveDeepLink("artikare://test", SITE)).toBe("/test");
    expect(resolveDeepLink("artikare://test?utm_source=whatsapp&dni=12345678", SITE)).toBe("/test?utm_source=whatsapp");
    expect(resolveDeepLink("artikare://blog/mito-gelatina", SITE)).toBe("/blog/mito-gelatina");
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
    ["another custom scheme", "otraapp://test"],
    ["a private screen through the app scheme", "artikare://app/reporte-medico"],
    ["the app scheme without host", "artikare:///test"],
    ["the app scheme with credentials", "artikare://user:pass@test"],
    ["the app scheme with a port", "artikare://test:8080/"],
    ["a javascript url", "javascript:alert(1)//artikare.com/test"],
    ["garbage", "no es una url"],
    ["a non-string", 42],
  ])("ignores %s", (_label, raw) => {
    expect(resolveDeepLink(raw, SITE)).toBeNull();
  });
});
