import { describe, expect, it } from "vitest";
import { pickNextMission } from "./nextMission";
import type { Activity } from "./schemas";

const mission = (id: string, doseId?: string) => ({ id, kind: doseId ? "dose" : "self-report", doseId }) as Activity;
const CHECK_IN = mission("chequeo");
const MORNING = mission("toma-manana", "morning-collagen");
const NIGHT = mission("toma-noche", "night-magnesium");
const STRETCH = mission("estira");
const MISSIONS = [CHECK_IN, MORNING, NIGHT, STRETCH];

/** Hora de Lima (UTC-5) del 12/10/2026. */
const atLima = (hhmm: string) => new Date(`2026-10-12T${hhmm}:00-05:00`);

describe("pickNextMission", () => {
  it("devuelve la primera misión pendiente en orden", () => {
    expect(pickNextMission(MISSIONS, new Set(), atLima("09:00"))).toBe(CHECK_IN);
  });

  it("no propone la toma de la noche (21:30) en la mañana: pasa a la siguiente misión", () => {
    const completed = new Set(["chequeo", "toma-manana"]);
    expect(pickNextMission(MISSIONS, completed, atLima("09:00"))).toBe(STRETCH);
  });

  it("propone la toma de la noche cuando ya es su hora en Lima", () => {
    const completed = new Set(["chequeo", "toma-manana"]);
    expect(pickNextMission(MISSIONS, completed, atLima("21:30"))).toBe(NIGHT);
  });

  it("devuelve null si solo quedan tomas que aún no tocan", () => {
    const completed = new Set(["chequeo", "toma-manana", "estira"]);
    expect(pickNextMission(MISSIONS, completed, atLima("12:00"))).toBeNull();
  });
});
