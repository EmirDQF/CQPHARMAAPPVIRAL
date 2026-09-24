import { describe, expect, it } from "vitest";
import { detectRedFlags } from "./redFlags";

describe("detectRedFlags", () => {
  it("returns no flags without scan or fracture history", () => {
    expect(detectRedFlags({ worstTScore: null, hasFractureHistory: false })).toEqual([]);
  });

  it("flags osteoporosis at exactly T = -2.5", () => {
    expect(detectRedFlags({ worstTScore: -2.5, hasFractureHistory: false })).toEqual([
      "osteoporosis",
    ]);
  });

  it("does not flag osteopenia", () => {
    expect(detectRedFlags({ worstTScore: -2.49, hasFractureHistory: false })).toEqual([]);
  });

  it("flags fracture history even without a scan", () => {
    expect(detectRedFlags({ worstTScore: null, hasFractureHistory: true })).toEqual([
      "fracture-history",
    ]);
  });

  it("returns both flags when both apply", () => {
    expect(detectRedFlags({ worstTScore: -3.1, hasFractureHistory: true })).toEqual([
      "osteoporosis",
      "fracture-history",
    ]);
  });
});
