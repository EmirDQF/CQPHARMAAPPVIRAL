import { describe, expect, it } from "vitest";
import { NO_T_SCORE_ICON, RISK_ICON } from "./riskIcons";

describe("RISK_ICON", () => {
  it("da una forma distinta a cada nivel OMS para no depender solo del color", () => {
    const icons = [RISK_ICON.bajo, RISK_ICON.moderado, RISK_ICON.alto];

    expect(new Set(icons).size).toBe(icons.length);
  });

  it("no reutiliza un icono del semáforo cuando no hay T-score aplicable", () => {
    expect(Object.values(RISK_ICON)).not.toContain(NO_T_SCORE_ICON);
  });
});
