import { describe, expect, it } from "vitest";
import { buildDailyReinforcementMessage } from "./reinforcementMessage";

const FORBIDDEN_CLAIMS = /revert|revier|regener|cura|optimiz|consolid|repar/i;

describe("buildDailyReinforcementMessage", () => {
  it.each([0, 1, 5, 10, 20, 45])("streak %i never makes a cure or reversal claim", (streakDays) => {
    expect(buildDailyReinforcementMessage(streakDays)).not.toMatch(FORBIDDEN_CLAIMS);
  });
});
