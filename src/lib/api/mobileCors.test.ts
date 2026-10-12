import { describe, expect, it } from "vitest";
import { corsHeadersFor, isMobileAppOrigin } from "./mobileCors";

describe("mobileCors", () => {
  it("solo reconoce los orígenes de Capacitor", () => {
    expect(isMobileAppOrigin("https://localhost")).toBe(true);
    expect(isMobileAppOrigin("capacitor://localhost")).toBe(true);
    expect(isMobileAppOrigin("https://evil.com")).toBe(false);
    expect(isMobileAppOrigin("http://localhost")).toBe(false);
    expect(isMobileAppOrigin(null)).toBe(false);
  });

  it("refleja el origen exacto, nunca un comodín, y no añade nada a otros", () => {
    expect(corsHeadersFor("https://localhost", false)).toEqual({
      "Access-Control-Allow-Origin": "https://localhost",
      Vary: "Origin",
    });
    expect(corsHeadersFor("https://evil.com", false)).toBeNull();
  });

  it("el preflight declara métodos y cabeceras permitidas", () => {
    const headers = corsHeadersFor("https://localhost", true);
    expect(headers?.["Access-Control-Allow-Headers"]).toBe("Authorization, Content-Type");
    expect(headers?.["Access-Control-Allow-Methods"]).toBe("GET, POST, OPTIONS");
  });
});
