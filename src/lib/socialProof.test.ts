import { describe, expect, it } from "vitest";
import { VERIFIED_SOCIAL_PROOF_STATS, buildSocialProofItems } from "./socialProof";

describe("social proof (B4)", () => {
  it("ships without unverified figures", () => {
    expect(VERIFIED_SOCIAL_PROOF_STATS).toEqual([]);
    const text = JSON.stringify(buildSocialProofItems(VERIFIED_SOCIAL_PROOF_STATS));
    expect(text).not.toMatch(/1,500|1\.500|100%|aval/i);
  });

  it("keeps the descriptive item and shows verified figures first", () => {
    const items = buildSocialProofItems([{ value: "250", label: "densitometrías realizadas" }]);
    expect(items[0]).toEqual({ value: "250", label: "densitometrías realizadas" });
    expect(items.at(-1)?.value).toBe("360°");
  });
});
