import { describe, expect, it, vi } from "vitest";
import { createSupabaseAppointmentRepository, type AppointmentRequest } from "./appointments";
import type { RepositoryClient } from "./supabaseRows";
import { RepositoryError } from "./types";

const request: AppointmentRequest = {
  code: "ART-ABCD23",
  serviceId: "densitometria",
  date: "2026-10-20",
  slot: "manana",
  patient: { name: "Paciente Prueba", age: 58, phone: "987654321", bookedBy: "propia" },
  consent: { consentAt: "2026-10-10T12:00:00.000Z", consentVersion: "2026-09-24-provisional" },
};

function clientReturning(result: { data: unknown; error: { code?: string; message: string } | null }) {
  const rpc = vi.fn(async () => result);
  return { client: { rpc } as unknown as RepositoryClient, rpc };
}

describe("SupabaseAppointmentRepository", () => {
  it("crea la cita por la RPC con el código propuesto y devuelve el código final", async () => {
    const { client, rpc } = clientReturning({ data: "ART-ABCD23", error: null });

    await expect(createSupabaseAppointmentRepository(client).create(request)).resolves.toEqual({
      ok: true,
      code: "ART-ABCD23",
    });
    expect(rpc).toHaveBeenCalledWith("create_appointment", {
      p_code: "ART-ABCD23",
      p_service_id: "densitometria",
      p_appointment_date: "2026-10-20",
      p_slot: "manana",
      p_patient_name: "Paciente Prueba",
      p_patient_age: 58,
      p_patient_phone: "987654321",
      p_booked_by: "propia",
      p_consent_version: "2026-09-24-provisional",
      p_consent_at: "2026-10-10T12:00:00.000Z",
    });
  });

  it("sin código propuesto deja que la base lo genere", async () => {
    const { client, rpc } = clientReturning({ data: "ART-ZZZZ99", error: null });

    await createSupabaseAppointmentRepository(client).create({ ...request, code: undefined });

    expect(rpc).toHaveBeenCalledWith("create_appointment", expect.objectContaining({ p_code: null }));
  });

  it("el límite por hora de la base se informa como rate-limited, no como fallo", async () => {
    const { client } = clientReturning({ data: null, error: { code: "P0429", message: "Límite" } });

    await expect(createSupabaseAppointmentRepository(client).create(request)).resolves.toEqual({
      ok: false,
      reason: "rate-limited",
    });
  });

  it("cualquier otro error de la base es un RepositoryError", async () => {
    const { client } = clientReturning({ data: null, error: { code: "42501", message: "Se requiere sesión" } });

    await expect(createSupabaseAppointmentRepository(client).create(request)).rejects.toBeInstanceOf(RepositoryError);
  });

  it("un código devuelto fuera del alfabeto se rechaza", async () => {
    const { client } = clientReturning({ data: "ART-IIII00", error: null });

    await expect(createSupabaseAppointmentRepository(client).create(request)).rejects.toBeInstanceOf(RepositoryError);
  });
});
