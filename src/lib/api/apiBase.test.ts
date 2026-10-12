import { describe, expect, it } from "vitest";
import { normalizeApiBase, resolveApiUrl } from "./apiBase";

describe("normalizeApiBase", () => {
  it("devuelve vacío sin valor", () => {
    expect(normalizeApiBase(undefined)).toBe("");
    expect(normalizeApiBase("  ")).toBe("");
  });

  it("quita la barra final y conserva el path", () => {
    expect(normalizeApiBase("https://api.artikare.com/")).toBe("https://api.artikare.com");
    expect(normalizeApiBase("https://artikare.com/v1/")).toBe("https://artikare.com/v1");
  });

  it("rechaza http y URLs inválidas", () => {
    expect(() => normalizeApiBase("http://artikare.com")).toThrow(/https/);
    expect(() => normalizeApiBase("no-es-url")).toThrow(/válida/);
  });
});

describe("resolveApiUrl", () => {
  it("usa ruta relativa sin base y absoluta con base", () => {
    expect(resolveApiUrl("/api/sync", "")).toBe("/api/sync");
    expect(resolveApiUrl("/api/sync", "https://artikare.com")).toBe("https://artikare.com/api/sync");
  });

  it("exige que la ruta empiece con /", () => {
    expect(() => resolveApiUrl("api/sync", "")).toThrow();
  });
});
