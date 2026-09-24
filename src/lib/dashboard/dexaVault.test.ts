import { describe, expect, it } from "vitest";
import {
  buildBoneScanSummaryFromEntries,
  parseStoredDexaEntries,
  classifyTScore,
  parseTScoreInput,
  validateScanDate,
  type DexaScanEntry,
} from "./dexaVault";

describe("parseTScoreInput", () => {
  it.each([
    ["-1.6", -1.6],
    ["-1,6", -1.6],
    [" -2.5 ", -2.5],
    ["0", 0],
    ["1.2", 1.2],
  ] as const)("accepts %j as %s", (raw, expected) => {
    expect(parseTScoreInput(raw)).toEqual({ ok: true, value: expected });
  });

  it.each(["", "abc", "-25", "-6.1", "4.1", "1e9", "--1"])("rejects %j", (raw) => {
    const result = parseTScoreInput(raw);
    expect(result.ok).toBe(false);
  });
});

describe("validateScanDate", () => {
  it("accepts today and past dates in Lima", () => {
    expect(validateScanDate("2026-09-24", "2026-09-24")).toBeNull();
    expect(validateScanDate("2025-01-10", "2026-09-24")).toBeNull();
  });

  it("rejects future dates and malformed input", () => {
    expect(validateScanDate("2026-09-25", "2026-09-24")).not.toBeNull();
    expect(validateScanDate("", "2026-09-24")).not.toBeNull();
    expect(validateScanDate("24/09/2026", "2026-09-24")).not.toBeNull();
  });
});

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

describe("parseTScoreInput sign normalization", () => {
  it.each([
    ["−2.7", -2.7],
    ["−2,7", -2.7],
    ["–1.4", -1.4],
    ["+0.5", 0.5],
  ] as const)("accepts %j as %s", (raw, expected) => {
    expect(parseTScoreInput(raw)).toEqual({ ok: true, value: expected });
  });
});

describe("buildBoneScanSummaryFromEntries with corrupted storage", () => {
  const validEntry: DexaScanEntry = {
    id: "dexa-1",
    date: "2026-01-10",
    lumbarTScore: -1.2,
    femoralNeckTScore: -1.5,
    radiologyCenter: "Centro A",
  };

  it("ignores entries whose T-scores are not finite numbers", () => {
    const corrupted = {
      ...validEntry,
      id: "dexa-2",
      date: "2026-05-01",
      lumbarTScore: "-2.8",
    } as unknown as DexaScanEntry;
    const summary = buildBoneScanSummaryFromEntries([validEntry, corrupted]);
    expect(summary?.scanDate).toBe("2026-01-10");
    expect(Number.isFinite(summary?.worstTScore)).toBe(true);
  });

  it("returns null when every entry is invalid", () => {
    const outOfRange = { ...validEntry, femoralNeckTScore: -40 };
    expect(buildBoneScanSummaryFromEntries([outOfRange])).toBeNull();
  });
});

describe("buildBoneScanSummaryFromEntries with an active red flag", () => {
  const osteopeniaEntry: DexaScanEntry = {
    id: "dexa-1",
    date: "2026-01-10",
    lumbarTScore: -1.8,
    femoralNeckTScore: -1.5,
    radiologyCenter: "Centro A",
  };

  it("replaces the supplement message with rheumatology-first guidance", () => {
    const summary = buildBoneScanSummaryFromEntries([osteopeniaEntry], { hasRedFlag: true });
    expect(summary?.diagnosisLabel).toBe("Osteopenia");
    expect(summary?.diagnosisMessage).not.toMatch(/Magnesio|suplemento puede/i);
    expect(summary?.diagnosisMessage).toMatch(/reumatólogo/);
  });

  it("keeps the osteopenia message without red flags", () => {
    const summary = buildBoneScanSummaryFromEntries([osteopeniaEntry]);
    expect(summary?.diagnosisMessage).toMatch(/complementar tu tratamiento/);
  });
});

describe("buildBoneScanSummaryFromEntries interpretation (B2)", () => {
  const osteoporosisScan = scan({ lumbarTScore: -2.8, femoralNeckTScore: -2.1 });

  it("replaces the WHO traffic light with a Z-score referral for a premenopausal woman", () => {
    const summary = buildBoneScanSummaryFromEntries([osteoporosisScan], {
      patient: { age: 42, sex: "femenino", menopausalStatus: "premenopausica" },
    });
    expect(summary?.interpretation).toBe("z-score-required");
    expect(summary?.riskLevel).toBeNull();
    expect(summary?.diagnosisLabel).toBe("Consulte a su médico (Z-score)");
    expect(`${summary?.diagnosisLabel} ${summary?.diagnosisMessage}`).not.toMatch(
      /Osteoporosis|Osteopenia|Normal|Magnesio/
    );
  });

  it("keeps the WHO classification for a postmenopausal woman of any age", () => {
    const summary = buildBoneScanSummaryFromEntries([osteoporosisScan], {
      patient: { age: 45, sex: "femenino", menopausalStatus: "posmenopausica" },
    });
    expect(summary?.interpretation).toBe("t-score");
    expect(summary?.riskLevel).toBe("alto");
    expect(summary?.diagnosisLabel).toBe("Osteoporosis");
    expect(summary?.profileNote).toBeNull();
  });

  it("shows a preliminary classification with a note when the profile is incomplete", () => {
    const summary = buildBoneScanSummaryFromEntries([osteoporosisScan]);
    expect(summary?.interpretation).toBe("incomplete-profile");
    expect(summary?.riskLevel).toBe("alto");
    expect(summary?.diagnosisLabel).toBe("Osteoporosis");
    expect(summary?.profileNote).toBe("Completa tu perfil para una evaluación exacta.");
  });

  it("assumes the WHO classification with a precaution for a woman ≥ 50 without menopausal status", () => {
    const summary = buildBoneScanSummaryFromEntries([osteoporosisScan], {
      patient: { age: 58, sex: "femenino", menopausalStatus: "no-aplica" },
    });
    expect(summary?.interpretation).toBe("t-score-assumed");
    expect(summary?.riskLevel).toBe("alto");
    expect(summary?.profileNote).toMatch(/estado menopáusico/);
  });
});

describe("low bone density in a Z-score patient", () => {
  it("shortens the next control like osteoporosis without using the WHO label", () => {
    const summary = buildBoneScanSummaryFromEntries(
      [scan({ lumbarTScore: -2.6, femoralNeckTScore: -1.9 })],
      { patient: { age: 38, sex: "masculino", menopausalStatus: null } }
    );
    expect(summary?.interpretation).toBe("z-score-required");
    expect(summary?.nextControlMonths).toBe(6);
  });
});

describe("parseStoredDexaEntries (artikare_dexa_vault_v1)", () => {
  it("keeps a stored array untouched", () => {
    const stored = [scan({ id: "a" })];
    expect(parseStoredDexaEntries(stored)).toEqual(stored);
  });

  it.each([null, "texto", { id: "a" }])("rejects a non-array value %j", (raw) => {
    expect(parseStoredDexaEntries(raw)).toBeNull();
  });
});
