import { describe, expect, it } from "vitest";
import { findForbiddenPhrases } from "../clinical/forbiddenCopy";
import { ACTIVITY_CATALOG, PHYSICAL_ACTIVITY_DISCLAIMER } from "./catalog";
import { activitySchema, type Activity } from "./schemas";
import { hashIsoDate, selectDailyMissions } from "./rotation";

const DATE = "2026-10-11";

describe("activity catalog", () => {
  it("has at least 14 validated activities with emoji, title, duration, XP and a safety tag", () => {
    expect(ACTIVITY_CATALOG.length).toBeGreaterThanOrEqual(14);
    ACTIVITY_CATALOG.forEach((activity) => expect(activitySchema.safeParse(activity).success).toBe(true));
  });

  it("covers every category the plan asks for", () => {
    const categories = new Set(ACTIVITY_CATALOG.map((activity) => activity.category));
    expect([...categories].sort()).toEqual(["cuerpo", "habitos", "mente", "registro", "social"]);
  });

  it("keeps the physical disclaimer free of forbidden copy", () => {
    expect(findForbiddenPhrases(PHYSICAL_ACTIVITY_DISCLAIMER)).toEqual([]);
  });

  it("rejects a body activity that is not tagged as physical", () => {
    const unsafe: Activity = { ...ACTIVITY_CATALOG.find((item) => item.id === "reto-silla")!, safety: "none" };
    expect(activitySchema.safeParse(unsafe).success).toBe(false);
  });

  it("rejects promises of cure in the copy", () => {
    const promise = { ...ACTIVITY_CATALOG[0], description: "Esto cura tus rodillas" };
    expect(activitySchema.safeParse(promise).success).toBe(false);
  });
});

describe("selectDailyMissions", () => {
  it("is deterministic for the same Lima date", () => {
    const first = selectDailyMissions({ catalog: ACTIVITY_CATALOG, date: DATE, goal: 7, hasRedFlag: false });
    const second = selectDailyMissions({ catalog: ACTIVITY_CATALOG, date: DATE, goal: 7, hasRedFlag: false });
    expect(first.map((item) => item.id)).toEqual(second.map((item) => item.id));
  });

  it("rotates between days", () => {
    const days = ["2026-10-11", "2026-10-12", "2026-10-13", "2026-10-14"].map((date) =>
      selectDailyMissions({ catalog: ACTIVITY_CATALOG, date, goal: 5, hasRedFlag: false })
        .map((item) => item.id)
        .join()
    );
    expect(new Set(days).size).toBeGreaterThan(1);
    expect(hashIsoDate("2026-10-11")).not.toBe(hashIsoDate("2026-10-12"));
  });

  it.each([3, 5, 7])("returns exactly %i missions, always including the core records", (goal) => {
    const missions = selectDailyMissions({ catalog: ACTIVITY_CATALOG, date: DATE, goal, hasRedFlag: false });
    expect(missions).toHaveLength(goal);
    expect(missions.filter((item) => item.core).map((item) => item.id)).toEqual(["chequeo-matutino", "toma-manana", "toma-noche"]);
    expect(new Set(missions.map((item) => item.id)).size).toBe(goal);
  });

  it("hides every physical activity when there is a red flag", () => {
    for (const date of ["2026-10-11", "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15"]) {
      const missions = selectDailyMissions({ catalog: ACTIVITY_CATALOG, date, goal: 7, hasRedFlag: true });
      expect(missions.some((item) => item.safety === "physical")).toBe(false);
      expect(missions).toHaveLength(7);
    }
  });

  it("never shows activities that require medical clearance", () => {
    const gated = ACTIVITY_CATALOG.map((item) => (item.category === "mente" ? { ...item, requiresClearance: true } : item));
    const missions = selectDailyMissions({ catalog: gated, date: DATE, goal: 7, hasRedFlag: false });
    expect(missions.some((item) => item.category === "mente")).toBe(false);
  });
});
