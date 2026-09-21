import { createPersistentStore } from "../storage/persistentStore";
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

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getNextUpcomingAppointment(
  appointments: Appointment[]
): Appointment | null {
  const today = todayIsoDate();
  const upcoming = appointments
    .filter((appointment) => appointment.date >= today)
    .sort(
      (a, b) => a.date.localeCompare(b.date) || a.slot.localeCompare(b.slot)
    );
  return upcoming[0] ?? null;
}

export const appointmentsStore = store;
