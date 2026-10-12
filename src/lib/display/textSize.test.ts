import { describe, expect, it } from "vitest";
import { DEFAULT_TEXT_SIZE, parseTextSize } from "./textSize";

describe("parseTextSize", () => {
  it("acepta una preferencia válida", () => {
    expect(parseTextSize({ version: 1, size: "xlarge" })).toEqual({ version: 1, size: "xlarge" });
  });

  it("vuelve a normal si el tamaño es desconocido", () => {
    expect(parseTextSize({ version: 1, size: "gigante" })).toEqual(DEFAULT_TEXT_SIZE);
  });

  it("devuelve null con una versión futura o basura", () => {
    expect(parseTextSize({ version: 2, size: "large" })).toBeNull();
    expect(parseTextSize("x")).toBeNull();
  });
});
