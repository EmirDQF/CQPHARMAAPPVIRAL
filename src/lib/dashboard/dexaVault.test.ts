import { describe, expect, it } from "vitest";
import { buildBoneScanSummaryFromEntries, classifyTScore, type DexaScanEntry } from "./dexaVault";

function scan(overrides: Partial<DexaScanEntry>): DexaScanEntry {
  return {
    id: "scan",
    date: "2026-08-15",
    lumbarTScore: 0,
    femoralNeckTScore: 0,
    radiologyCenter: "Centro de prueba",
    ...overrides,
  };
}

describe("classifyTScore (WHO)", () => {
  it.each([
    [0.5, "bajo"],
    [-1.0, "bajo"],
    [-1.01, "moderado"],
    [-2.49, "moderado"],
    [-2.5, "alto"],
    [-2.51, "alto"],
  ] as const)("T-score %s → %s", (tScore, expected) => {
    expect(classifyTScore(tScore)).toBe(expected);
  });
});

describe("buildBoneScanSummaryFromEntries", () => {
  it("returns null when the patient has not registered any scan", () => {
    expect(buildBoneScanSummaryFromEntries([])).toBeNull();
  });

  it("classifies with the worst of lumbar and femoral neck from the latest scan", () => {
    const summary = buildBoneScanSummaryFromEntries([
      scan({ id: "a", date: "2025-08-01", lumbarTScore: -3, femoralNeckTScore: -3 }),
      scan({ id: "b", date: "2026-08-15", lumbarTScore: -0.8, femoralNeckTScore: -2.5 }),
    ]);

    expect(summary?.worstTScore).toBe(-2.5);
    expect(summary?.riskLevel).toBe("alto");
    expect(summary?.diagnosisLabel).toBe("Osteoporosis");
    expect(summary?.nextControlMonths).toBe(6);
  });

  it("never promises to cure or reverse bone loss", () => {
    for (const tScore of [-0.5, -1.6, -3]) {
      const summary = buildBoneScanSummaryFromEntries([
        scan({ lumbarTScore: tScore, femoralNeckTScore: tScore }),
      ]);
      expect(summary?.diagnosisMessage).not.toMatch(/revert|revier|regener|cura/i);
    }
  });
});
