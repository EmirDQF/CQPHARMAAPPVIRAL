import { describe, expect, it } from "vitest";
import {
  getBoneDensityInterpretation,
  isMenopauseUncertain,
  MENOPAUSE_UNCERTAIN_NOTE,
  menopausalStatusSchema,
} from "./tScoreEligibility";

describe("getBoneDensityInterpretation (CLAUDE.md)", () => {
  it.each([
    [{ age: 50, sex: "masculino", menopausalStatus: null }, "t-score"],
    [{ age: 49, sex: "masculino", menopausalStatus: null }, "z-score-required"],
    [{ age: 45, sex: "femenino", menopausalStatus: "posmenopausica" }, "t-score"],
    [{ age: 55, sex: "femenino", menopausalStatus: "premenopausica" }, "z-score-required"],
    [{ age: 52, sex: "femenino", menopausalStatus: "no-segura" }, "z-score-required"],
    [{ age: 52, sex: "femenino", menopausalStatus: "no-decir" }, "z-score-required"],
    [{ age: 60, sex: "femenino", menopausalStatus: null }, "t-score-assumed"],
    [{ age: 40, sex: "femenino", menopausalStatus: "no-segura" }, "z-score-required"],
    [{ age: 45, sex: "femenino", menopausalStatus: "premenopausica" }, "z-score-required"],
    [{ age: 32, sex: "femenino", menopausalStatus: null }, "z-score-required"],
    [{ age: null, sex: "femenino", menopausalStatus: "no-decir" }, "z-score-required"],
    [{ age: null, sex: "masculino", menopausalStatus: null }, "incomplete-profile"],
    [{ age: 60, sex: null, menopausalStatus: null }, "incomplete-profile"],
  ] as const)("%j → %s", (patient, expected) => {
    expect(getBoneDensityInterpretation(patient)).toBe(expected);
  });

  it("postmenopausal status wins even without age", () => {
    expect(
      getBoneDensityInterpretation({ age: null, sex: "femenino", menopausalStatus: "posmenopausica" })
    ).toBe("t-score");
  });
});

describe("uncertain menopausal status (No estoy segura / Prefiero no decirlo)", () => {
  it.each(["no-segura", "no-decir"] as const)("%s never assumes postmenopause", (status) => {
    expect(isMenopauseUncertain({ age: 65, sex: "femenino", menopausalStatus: status })).toBe(true);
    expect(getBoneDensityInterpretation({ age: 65, sex: "femenino", menopausalStatus: status })).toBe(
      "z-score-required"
    );
  });

  it("a known status or a man is never uncertain", () => {
    expect(isMenopauseUncertain({ age: 60, sex: "femenino", menopausalStatus: "posmenopausica" })).toBe(false);
    expect(isMenopauseUncertain({ age: 60, sex: "masculino", menopausalStatus: null })).toBe(false);
  });

  it("explains kindly that the doctor will confirm it", () => {
    expect(MENOPAUSE_UNCERTAIN_NOTE).toBe("Tu médico confirmará esto contigo.");
  });
});

describe("menopausalStatusSchema (migration)", () => {
  it("migrates the legacy combined value no-aplica to no-segura without losing the answer", () => {
    expect(menopausalStatusSchema.parse("no-aplica")).toBe("no-segura");
  });

  it.each(["premenopausica", "posmenopausica", "no-segura", "no-decir"])("keeps %s", (status) => {
    expect(menopausalStatusSchema.parse(status)).toBe(status);
  });

  it("rejects unknown values", () => {
    expect(menopausalStatusSchema.safeParse("perimenopausica").success).toBe(false);
  });
});
