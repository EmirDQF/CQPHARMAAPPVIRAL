import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEV_CLEARTEXT_HOSTS,
  DEV_DEFAULT_SERVER_URL,
  resolveBundledApiBase,
  resolveCapMode,
  resolveCapacitorServer,
} from "./capacitorEnv";

describe("resolveCapacitorServer", () => {
  it("dev without URL uses localhost over http with cleartext", () => {
    expect(resolveCapacitorServer({ CAP_ENV: "dev" })).toEqual({
      env: "dev",
      url: `${DEV_DEFAULT_SERVER_URL}/`,
      cleartext: true,
      allowMixedContent: false,
    });
  });

  it("dev accepts an explicit loopback URL", () => {
    expect(resolveCapacitorServer({ CAP_ENV: "dev", CAP_SERVER_URL: "http://127.0.0.1:4000" }).url).toBe(
      "http://127.0.0.1:4000/"
    );
  });

  it("dev rejects http to a LAN IP (the debug network config only allows loopback)", () => {
    expect(() => resolveCapacitorServer({ CAP_ENV: "dev", CAP_SERVER_URL: "http://192.168.1.20:3000" })).toThrow(
      /localhost/
    );
  });

  it("release with https URL is accepted without cleartext", () => {
    expect(resolveCapacitorServer({ CAP_ENV: "release", CAP_SERVER_URL: "https://app.ejemplo.pe" })).toEqual({
      env: "release",
      url: "https://app.ejemplo.pe/",
      cleartext: false,
      allowMixedContent: false,
    });
  });

  it("treats an unset CAP_ENV as release", () => {
    expect(() => resolveCapacitorServer({})).toThrow(/CAP_SERVER_URL/);
    expect(resolveCapacitorServer({ CAP_SERVER_URL: "https://app.ejemplo.pe" }).env).toBe("release");
  });

  it.each([
    ["missing URL", undefined, /falta/],
    ["empty URL", "  ", /falta/],
    ["http URL", "http://app.ejemplo.pe", /https/],
    ["localhost", "https://localhost:3000", /local/],
    ["loopback IP", "https://127.0.0.1", /local/],
    ["private IP", "https://10.0.0.5", /local/],
    ["emulator host", "https://10.0.2.2", /local/],
    ["IPv6 loopback", "https://[::1]", /local/],
    [".local host", "https://pc.local", /local/],
    ["localhost with trailing dot", "https://localhost./", /local/],
    [".local with trailing dot", "https://pc.local./", /local/],
    ["credentials", "https://user:pass@app.ejemplo.pe", /credenciales/],
    ["not a URL", "artikare", /URL/],
  ])("release fails with %s", (_label, url, message) => {
    expect(() => resolveCapacitorServer({ CAP_ENV: "release", CAP_SERVER_URL: url })).toThrow(message);
  });

  it("rejects an unknown CAP_ENV instead of guessing", () => {
    expect(() => resolveCapacitorServer({ CAP_ENV: "production", CAP_SERVER_URL: "https://app.ejemplo.pe" })).toThrow(
      /CAP_ENV/
    );
  });

  it("never echoes the URL value in errors", () => {
    expect(() => resolveCapacitorServer({ CAP_ENV: "release", CAP_SERVER_URL: "http://secreto.ejemplo.pe" })).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining("secreto") })
    );
  });
});

describe("DEV_CLEARTEXT_HOSTS", () => {
  // Misma lista en el network_security_config de debug y en el shell offline (sin bundler).
  it("matches the debug network config and the offline shell", () => {
    const debugConfig = readFileSync(
      join(process.cwd(), "android", "app", "src", "debug", "res", "xml", "network_security_config.xml"),
      "utf8"
    );
    const domains = [...debugConfig.matchAll(/<domain[^>]*>([^<]+)<\/domain>/g)].map(([, domain]) => domain);
    const offlineJs = readFileSync(join(process.cwd(), "capacitor-shell-src", "offline.js"), "utf8");
    const shellHosts = JSON.parse(/DEV_CLEARTEXT_HOSTS = (\[[^\]]*\])/.exec(offlineJs)?.[1] ?? "[]");

    expect(domains).toEqual(DEV_CLEARTEXT_HOSTS);
    expect(shellHosts).toEqual(DEV_CLEARTEXT_HOSTS);
  });
});

describe("resolveCapMode", () => {
  it("sin definir sigue en remote y acepta bundled", () => {
    expect(resolveCapMode({})).toBe("remote");
    expect(resolveCapMode({ CAP_MODE: " bundled " })).toBe("bundled");
  });

  it("rechaza un modo desconocido en vez de adivinar", () => {
    expect(() => resolveCapMode({ CAP_MODE: "hibrido" })).toThrow(/CAP_MODE/);
  });
});

describe("resolveBundledApiBase", () => {
  it("devuelve la base https normalizada", () => {
    expect(resolveBundledApiBase({ NEXT_PUBLIC_API_BASE_URL: "https://api.artikare.com/" })).toBe("https://api.artikare.com");
  });

  it.each([
    ["falta", undefined, /falta/],
    ["http", "http://api.artikare.com", /https/],
    ["no es URL", "artikare", /https/],
    ["localhost", "https://localhost:3000", /local/],
    ["IP privada", "https://192.168.1.5", /local/],
  ])("falla si %s, sin repetir el valor", (_label, value, message) => {
    expect(() => resolveBundledApiBase({ NEXT_PUBLIC_API_BASE_URL: value })).toThrow(message);
  });
});
