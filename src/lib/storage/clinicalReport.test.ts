import { describe, expect, it } from "vitest";
import {
  buildClinicalReportSummary,
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
