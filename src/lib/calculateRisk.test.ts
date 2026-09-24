import { describe, expect, it } from "vitest";
import { calculateRisk } from "./calculateRisk";
import type { ScoredAnswers } from "./types";

const HEALTHIEST_ANSWERS: ScoredAnswers = {
  rigidezMatutina: "no",
  crujidos: "nunca",
  fuerzaMovilidad: "no",
  antecedentesFamiliares: "no",
  nutricionMineral: "si",
  habitosImpacto: "fuerza",
};

const WORST_ANSWERS: ScoredAnswers = {
  rigidezMatutina: "severa",
  crujidos: "frecuente",
  fuerzaMovilidad: "frecuente",
  antecedentesFamiliares: "si",
  nutricionMineral: "casi_nunca",
  habitosImpacto: "sedentario",
};

describe("calculateRisk", () => {
  it("returns low risk and caps articular age at 5 years below the real age", () => {
    const result = calculateRisk({ age: 40, sex: "masculino" }, HEALTHIEST_ANSWERS);

    expect(result.riskScore).toBe(-4);
    expect(result.riskLevel).toBe("bajo");
    expect(result.articularAge).toBe(36);
  });

  it("returns high risk when every answer is the worst option", () => {
    const result = calculateRisk({ age: 52, sex: "masculino" }, WORST_ANSWERS);

    expect(result.riskScore).toBe(17);
    expect(result.riskLevel).toBe("alto");
    expect(result.articularAge).toBe(69);
  });

  it("adds 2 points for women aged 45 or older", () => {
    const answers = { ...HEALTHIEST_ANSWERS, nutricionMineral: "a_veces", habitosImpacto: "movimiento" };

    expect(calculateRisk({ age: 44, sex: "femenino" }, answers).riskScore).toBe(0);
    expect(calculateRisk({ age: 45, sex: "femenino" }, answers).riskScore).toBe(2);
    expect(calculateRisk({ age: 45, sex: "masculino" }, answers).riskScore).toBe(0);
  });

  it("uses score 1 as the last low-risk value and 7 as the last moderate value", () => {
    const base = { ...HEALTHIEST_ANSWERS, nutricionMineral: "a_veces", habitosImpacto: "movimiento" };
    const scoreOne = { ...base, crujidos: "ocasional" };
    const scoreTwo = { ...base, crujidos: "frecuente" };
    const scoreSeven = { ...base, rigidezMatutina: "severa", antecedentesFamiliares: "si" };
    const scoreEight = { ...scoreSeven, crujidos: "ocasional" };
    const male = { age: 50, sex: "masculino" } as const;

    expect(calculateRisk(male, scoreOne).riskLevel).toBe("bajo");
    expect(calculateRisk(male, scoreTwo).riskLevel).toBe("moderado");
    expect(calculateRisk(male, scoreSeven).riskLevel).toBe("moderado");
    expect(calculateRisk(male, scoreEight).riskLevel).toBe("alto");
  });

  it("ignores unanswered questions", () => {
    expect(calculateRisk({ age: 50, sex: "masculino" }, {}).riskScore).toBe(0);
  });
});
