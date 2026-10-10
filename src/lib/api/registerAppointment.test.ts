// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appointmentsStore } from "../appointments/store";
import type { Appointment } from "../appointments/types";
import type { OutboxEntry } from "./outbox";
import { applyServerAppointmentCode } from "./registerAppointment";

const appointment: Appointment = {
  code: "ART-ABCD23",
  serviceId: "densitometria",
  date: "2026-10-20",
  slot: "manana",
  patient: { name: "Paciente Prueba", age: 58, phone: "987654321", bookedBy: "propia" },
  createdAt: "2026-10-10T12:00:00.000Z",
};

const entry: OutboxEntry = {
  id: "entrada-1",
  endpoint: "/api/appointments",
  body: { code: "ART-ABCD23" },
  containsPersonalData: true,
  attempts: 0,
  retries: 0,
  nextAttemptAt: 0,
};

function created(code: unknown): Response {
  return new Response(JSON.stringify({ success: true, data: { code } }), { status: 201 });
}

beforeEach(() => {
  appointmentsStore.write([appointment]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("applyServerAppointmentCode", () => {
  it("si la base asignó otro código (colisión), la cita local lo adopta", async () => {
    await applyServerAppointmentCode(entry, created("ART-ZZZZ99"));

    expect(appointmentsStore.getSnapshot()).toEqual([{ ...appointment, code: "ART-ZZZZ99" }]);
  });

  it("con el mismo código no reescribe nada", async () => {
    const write = vi.spyOn(appointmentsStore, "write");

    await applyServerAppointmentCode(entry, created("ART-ABCD23"));

    expect(write).not.toHaveBeenCalled();
  });

  it("ignora una respuesta con un código fuera del alfabeto", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    await applyServerAppointmentCode(entry, created("ART-IIII00"));

    expect(appointmentsStore.getSnapshot()).toEqual([appointment]);
  });

  it("solo toca la cita de ese código, nunca otras", async () => {
    const other = { ...appointment, code: "ART-QQQQ22" };
    appointmentsStore.write([appointment, other]);

    await applyServerAppointmentCode(entry, created("ART-ZZZZ99"));

    expect(appointmentsStore.getSnapshot()).toEqual([{ ...appointment, code: "ART-ZZZZ99" }, other]);
  });
});
