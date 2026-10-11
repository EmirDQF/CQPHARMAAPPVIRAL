import { describe, expect, it } from "vitest";
import { verifyEnv, type EnvMap } from "./verifyEnv";

// Valores sintéticos con el formato correcto; ninguno es una credencial real.
const VALID_RELEASE_ENV: EnvMap = {
  NEXT_PUBLIC_SUPABASE_URL: "https://proyecto.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key-sintetica-0123456789",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-sintetica-0123456789",
  NEXT_PUBLIC_SITE_URL: "https://artikare.com",
  CAP_SERVER_URL: "https://artikare.com",
  ANDROID_SHA256_FINGERPRINT: Array.from({ length: 32 }, () => "AB").join(":"),
  NEXT_PUBLIC_WHATSAPP_NUMBER: "51987654321",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0x4AAAAAAA-sintetica",
};

describe("verifyEnv", () => {
  it("passes a complete release configuration", () => {
    expect(verifyEnv(VALID_RELEASE_ENV, { strict: true })).toEqual({ errors: [], warnings: [] });
  });

  it("only warns in development so guest mode without Supabase keeps working", () => {
    const report = verifyEnv({}, { strict: false });

    expect(report.errors).toEqual([]);
    expect(report.warnings).toContain("NEXT_PUBLIC_SUPABASE_URL: falta");
  });

  it("fails in strict mode for missing values, plain http and malformed fingerprints", () => {
    const report = verifyEnv(
      {
        ...VALID_RELEASE_ENV,
        SUPABASE_SERVICE_ROLE_KEY: undefined,
        CAP_SERVER_URL: "http://artikare.com",
        ANDROID_SHA256_FINGERPRINT: "AB:CD",
      },
      { strict: true }
    );

    expect(report.errors).toEqual([
      "SUPABASE_SERVICE_ROLE_KEY: falta",
      "CAP_SERVER_URL: formato inválido",
      "ANDROID_SHA256_FINGERPRINT: formato inválido",
    ]);
  });

  it("always fails when a secret is exposed with the NEXT_PUBLIC_ prefix, by name or by value", () => {
    const report = verifyEnv(
      {
        ...VALID_RELEASE_ENV,
        NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: "x",
        NEXT_PUBLIC_ALGO: VALID_RELEASE_ENV.SUPABASE_SERVICE_ROLE_KEY,
      },
      { strict: false }
    );

    expect(report.errors).toHaveLength(2);
    expect(report.errors.join(" ")).toContain("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
    expect(report.errors.join(" ")).toContain("NEXT_PUBLIC_ALGO");
  });

  it("never echoes a value in its messages", () => {
    const report = verifyEnv(
      { ...VALID_RELEASE_ENV, NEXT_PUBLIC_ALGO: VALID_RELEASE_ENV.SUPABASE_SERVICE_ROLE_KEY, CAP_SERVER_URL: "http://x.pe" },
      { strict: true }
    );
    const output = [...report.errors, ...report.warnings].join("\n");

    Object.values(VALID_RELEASE_ENV).forEach((value) => expect(output).not.toContain(value));
    expect(output).not.toContain("http://x.pe");
  });
});
