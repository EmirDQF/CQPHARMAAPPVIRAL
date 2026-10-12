import { DOSE_SCHEDULE } from "../clinical/constants";
import { doseSlotStatus } from "../dashboard/myDay";
import type { Activity } from "./schemas";

/**
 * "Tu siguiente paso": la primera misión pendiente que se puede hacer ahora.
 * Salta las tomas cuya hora (Lima) aún no llega, para no invitar a anotar la
 * toma de las 21:30 en la mañana.
 */
export function pickNextMission(
  missions: readonly Activity[],
  completed: ReadonlySet<string>,
  now: Date
): Activity | null {
  return (
    missions.find((mission) => {
      if (completed.has(mission.id)) return false;
      const dose = mission.doseId ? DOSE_SCHEDULE.find((slot) => slot.id === mission.doseId) : undefined;
      return !dose || doseSlotStatus(dose.time, false, now) !== "upcoming";
    }) ?? null
  );
}
