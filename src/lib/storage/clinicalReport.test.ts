import { describe, expect, it } from "vitest";
import {
  buildClinicalReportSummary,
  describeStiffnessChange,
  formatClinicalReportText,
  selectLast30DaysEntries,
} from "./clinicalReport";
import type { PainLogEntry } from "../dashboard/types";

const NOON_IN_LIMA_SEP_30 = new Date("2026-09-30T17:00:00Z");

function entry(date: string, painLevel: number): PainLogEntry {
  return { date, painLevel, stiffness: "15-30" };
}

describe("selectLast30DaysEntries", () => {
  it("keeps only real entries inside the last 30 Lima days, oldest first", () => {
    const entries = [
      entry("2026-08-31", 9),
      entry("2026-09-30", 3),
      entry("2026-09-01", 5),
    ];

    expect(selectLast30DaysEntries(entries, NOON_IN_LIMA_SEP_30).map((e) => e.date)).toEqual([
      "2026-09-01",
      "2026-09-30",
    ]);
  });
});

describe("buildClinicalReportSummary", () => {
  it("reports no pain data instead of inventing a demo history", () => {
    const summary = buildClinicalReportSummary([], { takenDoseIdsByDate: {} }, NOON_IN_LIMA_SEP_30);

    expect(summary.daysTracked).toBe(0);
    expect(summary.averagePainLevel).toBeNull();
    expect(summary.stiffnessReductionPercent).toBeNull();
    expect(summary.adherencePercent).toBe(0);
  });

  it("averages only what the patient registered", () => {
    const summary = buildClinicalReportSummary(
      [entry("2026-09-29", 4), entry("2026-09-30", 6)],
      { takenDoseIdsByDate: {} },
      NOON_IN_LIMA_SEP_30
    );

    expect(summary.daysTracked).toBe(2);
    expect(summary.averagePainLevel).toBe(5);
  });

  it("formats an explicit 'no data' line when nothing was registered", () => {
    const summary = buildClinicalReportSummary([], { takenDoseIdsByDate: {} }, NOON_IN_LIMA_SEP_30);
    expect(formatClinicalReportText(summary)).toContain("Sin registros de dolor");
  });
});

describe("describeStiffnessChange", () => {
  it.each([
    [30, "disminuyó 30%"],
    [-20, "aumentó 20%"],
    [0, "se mantuvo sin cambios"],
  ] as const)("%s → %s", (percent, expected) => {
    expect(describeStiffnessChange(percent)).toBe(expected);
  });
});

describe("formatClinicalReportText bone data", () => {
  const summary = {
    averagePainLevel: 4,
    stiffnessReductionPercent: 30,
    adherencePercent: 80,
    daysTracked: 10,
  };

  it("includes worst T-score, classification, date and fracture history", () => {
    const text = formatClinicalReportText(
      summary,
      { worstTScore: -2.6, diagnosisLabel: "Osteoporosis", scanDate: "2026-08-15" },
      true
    );
    expect(text).toContain("Peor T-score -2.6 (Osteoporosis) · 2026-08-15");
    expect(text).toContain("Antecedente de fractura: Sí");
    expect(text).toContain("disminuyó 30%");
  });

  it("never invents a T-score when there is no scan", () => {
    const text = formatClinicalReportText(summary, null, false);
    expect(text).toContain("Densitometría: Sin densitometría registrada");
    expect(text).toContain("Antecedente de fractura: No");
  });
});
