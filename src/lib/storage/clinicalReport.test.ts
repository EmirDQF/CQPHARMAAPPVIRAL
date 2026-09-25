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
      {
        worstTScore: -2.6,
        diagnosisLabel: "Osteoporosis",
        scanDate: "2026-08-15",
        interpretation: "t-score",
        profileNote: null,
      },
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

describe("formatClinicalReportText interpretation (B2)", () => {
  const summary = {
    averagePainLevel: null,
    stiffnessReductionPercent: null,
    adherencePercent: 0,
    daysTracked: 0,
  };

  it("prints the Z-score referral instead of a WHO label", () => {
    const text = formatClinicalReportText(
      summary,
      {
        worstTScore: -2.8,
        diagnosisLabel: "Consulte a su médico (Z-score)",
        scanDate: "2026-08-15",
        interpretation: "z-score-required",
        profileNote: null,
      },
      false
    );
    expect(text).toContain("Consulte a su médico (Z-score)");
    expect(text).not.toMatch(/Osteoporosis|Osteopenia|Normal/);
  });

  it("adds the profile note to a preliminary classification", () => {
    const text = formatClinicalReportText(
      summary,
      {
        worstTScore: -2.6,
        diagnosisLabel: "Osteoporosis",
        scanDate: "2026-08-15",
        interpretation: "incomplete-profile",
        profileNote: "Completa tu perfil para una evaluación exacta.",
      },
      false
    );
    expect(text).toContain("Completa tu perfil para una evaluación exacta.");
  });

  it("says the fracture question was not answered", () => {
    expect(formatClinicalReportText(summary, null, null)).toContain(
      "Antecedente de fractura: No registrado"
    );
  });
});

describe("formatClinicalReportText red flags", () => {
  const summary = {
    averagePainLevel: 8.5,
    stiffnessReductionPercent: null,
    adherencePercent: 0,
    daysTracked: 5,
  };

  it("lists every active red flag for the specialist", () => {
    const text = formatClinicalReportText(summary, null, true, [
      "Registraste antecedente de fractura.",
      "Registraste dolor de 8 o más durante 3 días seguidos en las últimas 2 semanas.",
    ]);
    expect(text).toContain("Banderas rojas: Registraste antecedente de fractura. · Registraste dolor");
  });

  it("states when there are no red flags", () => {
    expect(formatClinicalReportText(summary, null, false, [])).toContain(
      "Banderas rojas: Ninguna activa"
    );
  });
});

describe("pain level 0 (sin dolor)", () => {
  it("counts 0 in the average instead of skipping the day", () => {
    const summary = buildClinicalReportSummary(
      [entry("2026-09-28", 0), entry("2026-09-29", 0), entry("2026-09-30", 9)],
      { takenDoseIdsByDate: {} },
      NOON_IN_LIMA_SEP_30
    );
    expect(summary.averagePainLevel).toBe(3);
    expect(summary.daysTracked).toBe(3);
  });

  it("reports an average of 0/10 when every day was without pain", () => {
    const summary = buildClinicalReportSummary(
      [entry("2026-09-29", 0), entry("2026-09-30", 0)],
      { takenDoseIdsByDate: {} },
      NOON_IN_LIMA_SEP_30
    );
    expect(summary.averagePainLevel).toBe(0);
    expect(formatClinicalReportText(summary)).toContain("0/10");
  });
});
