import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import { SECURITY_HEADERS } from "./securityHeaders";

describe("security headers", () => {
  it("applies them to every route", async () => {
    const rules = (await nextConfig.headers?.()) ?? [];
    const catchAll = rules.find((rule) => rule.source === "/:path*");
    expect(catchAll?.headers).toEqual(SECURITY_HEADERS);
  });

  it("forbids framing, MIME sniffing and leaking full URLs (they may carry health context)", () => {
    const byKey = Object.fromEntries(SECURITY_HEADERS.map(({ key, value }) => [key, value]));
    expect(byKey["X-Frame-Options"]).toBe("DENY");
    expect(byKey["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(byKey["X-Content-Type-Options"]).toBe("nosniff");
    expect(byKey["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(byKey["Strict-Transport-Security"]).toMatch(/max-age=\d{8,}/);
  });

  it("does not grant camera, microphone or location to the page", () => {
    const permissions = SECURITY_HEADERS.find(({ key }) => key === "Permissions-Policy")?.value ?? "";
    ["camera=()", "microphone=()", "geolocation=()"].forEach((rule) => expect(permissions).toContain(rule));
  });
});
