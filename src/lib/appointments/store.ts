import { createPersistentStore } from "../storage/persistentStore";
import { toLimaIsoDate } from "../utils/date";
import { generateAppointmentCode } from "./generateCode";
import type { Appointment } from "./types";

const store = createPersistentStore<Appointment[]>("artikare_appointments_v1", []);

export function bookAppointment(
  input: Omit<Appointment, "code" | "createdAt">
): Appointment {
  const appointment: Appointment = {
    ...input,
    code: generateAppointmentCode(),
    createdAt: new Date().toISOString(),
  };
  store.write([...store.getSnapshot(), appointment]);
  return appointment;
}

function compareBySchedule(a: Appointment, b: Appointment): number {
  return a.date.localeCompare(b.date) || a.slot.localeCompare(b.slot);
}

/** Citas de hoy en adelante (fecha de Lima), la más próxima primero. */
export function getUpcomingAppointments(
  appointments: readonly Appointment[],
  now: Date = new Date()
): Appointment[] {
  const today = toLimaIsoDate(now);
  return appointments.filter((appointment) => appointment.date >= today).sort(compareBySchedule);
}

/** Citas anteriores a hoy (fecha de Lima), la más reciente primero. */
export function getPastAppointments(
  appointments: readonly Appointment[],
  now: Date = new Date()
): Appointment[] {
  const today = toLimaIsoDate(now);
  return appointments
    .filter((appointment) => appointment.date < today)
    .sort((a, b) => compareBySchedule(b, a));
}

export function getNextUpcomingAppointment(
  appointments: readonly Appointment[],
  now: Date = new Date()
): Appointment | null {
  return getUpcomingAppointments(appointments, now)[0] ?? null;
}

export const appointmentsStore = store;
