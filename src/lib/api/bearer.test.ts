import { describe, expect, it } from "vitest";
import { parseBearerToken } from "./bearer";

describe("parseBearerToken", () => {
  it("extrae el token de un Bearer válido", () => {
    expect(parseBearerToken("Bearer eyJhbGci.eyJzdWIi.sig-_")).toBe("eyJhbGci.eyJzdWIi.sig-_");
  });

  it("rechaza esquemas distintos, vacíos y tokens con espacios o símbolos raros", () => {
    expect(parseBearerToken(null)).toBeNull();
    expect(parseBearerToken("Basic abc")).toBeNull();
    expect(parseBearerToken("Bearer ")).toBeNull();
    expect(parseBearerToken("Bearer a b")).toBeNull();
    expect(parseBearerToken("Bearer a;b")).toBeNull();
  });
});
