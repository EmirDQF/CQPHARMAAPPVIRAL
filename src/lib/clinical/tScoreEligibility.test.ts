import { describe, expect, it } from "vitest";
import { getBoneDensityInterpretation } from "./tScoreEligibility";

describe("getBoneDensityInterpretation (CLAUDE.md)", () => {
  it.each([
    [{ age: 50, sex: "masculino", menopausalStatus: null }, "t-score"],
    [{ age: 49, sex: "masculino", menopausalStatus: null }, "z-score-required"],
    [{ age: 45, sex: "femenino", menopausalStatus: "posmenopausica" }, "t-score"],
    [{ age: 55, sex: "femenino", menopausalStatus: "premenopausica" }, "z-score-required"],
    [{ age: 52, sex: "femenino", menopausalStatus: "no-aplica" }, "t-score-assumed"],
    [{ age: 60, sex: "femenino", menopausalStatus: null }, "t-score-assumed"],
    [{ age: 40, sex: "femenino", menopausalStatus: "no-aplica" }, "z-score-required"],
    [{ age: 32, sex: "femenino", menopausalStatus: null }, "z-score-required"],
    [{ age: null, sex: "femenino", menopausalStatus: "no-aplica" }, "incomplete-profile"],
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
