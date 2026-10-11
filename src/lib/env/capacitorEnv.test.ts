import { describe, expect, it } from "vitest";
import { DEV_DEFAULT_SERVER_URL, resolveCapacitorServer } from "./capacitorEnv";

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
