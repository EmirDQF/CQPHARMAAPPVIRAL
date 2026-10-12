import { describe, expect, it } from "vitest";
import { DOSE_SCHEDULE } from "@/lib/clinical/constants";
import { buildWeekAdherence } from "./weekAdherence";

// 2026-10-12 15:00 UTC = 10:00 en Lima (lunes).
const NOW = new Date("2026-10-12T15:00:00Z");

describe("buildWeekAdherence", () => {
  it("devuelve 7 días con hoy al final y letras en español", () => {
    const week = buildWeekAdherence({}, NOW);
    expect(week).toHaveLength(7);
    expect(week[6]).toMatchObject({ isoDate: "2026-10-12", weekdayLetter: "L", isToday: true });
    expect(week[0].isoDate).toBe("2026-10-06");
    expect(week.filter((day) => day.isToday)).toHaveLength(1);
  });

  it("clasifica completo, parcial y sin tomas", () => {
    const allIds = DOSE_SCHEDULE.map((dose) => dose.id);
    const week = buildWeekAdherence(
      { "2026-10-12": [allIds[0]], "2026-10-11": allIds, "2026-10-10": ["desconocida"] },
      NOW,
    );
    expect(week[6].adherence).toBe("partial");
    expect(week[5].adherence).toBe("complete");
    expect(week[4].adherence).toBe("none");
  });

  it("calcula el día con la fecha de Lima, no la UTC", () => {
    // 03:00 UTC del 13 = 22:00 del 12 en Lima.
    const week = buildWeekAdherence({}, new Date("2026-10-13T03:00:00Z"));
    expect(week[6].isoDate).toBe("2026-10-12");
  });
});
