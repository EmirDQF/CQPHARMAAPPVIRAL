import { describe, expect, it, vi } from "vitest";
import type { AppointmentRepository } from "@/lib/repositories/appointments";
import { RepositoryError } from "@/lib/repositories/types";
import { APPOINTMENT_RETRY_AFTER_SECONDS, handleCreateAppointment } from "./handleCreateAppointment";

const requester = { id: "00000000-0000-4000-8000-00000000a11c", isAnonymous: true };
const body = {
  code: "ART-ABCD23",
  serviceId: "densitometria",
  date: "2026-10-20",
  slot: "manana",
  patient: { name: "Paciente Prueba", age: 58, phone: "987654321", bookedBy: "propia" },
  consent: { consentAt: "2026-10-10T12:00:00.000Z", consentVersion: "2026-09-24-provisional" },
};

function repositoryReturning(create: AppointmentRepository["create"]): AppointmentRepository {
  return { create: vi.fn(create) };
}

describe("handleCreateAppointment", () => {
  it("con sesión (también anónima) crea la cita y devuelve el código final", async () => {
    const repository = repositoryReturning(async () => ({ ok: true, code: "ART-ABCD23" }));

    await expect(handleCreateAppointment({ repository, requester, body })).resolves.toEqual({
      status: 201,
      data: { code: "ART-ABCD23" },
    });
  });

  it("devuelve el código que asignó la base si el propuesto ya estaba tomado", async () => {
    const repository = repositoryReturning(async () => ({ ok: true, code: "ART-ZZZZ99" }));

    await expect(handleCreateAppointment({ repository, requester, body })).resolves.toMatchObject({
      data: { code: "ART-ZZZZ99" },
    });
  });

  it("sin sesión responde 401 y no llama a la base", async () => {
    const repository = repositoryReturning(async () => ({ ok: true, code: "ART-ABCD23" }));

    await expect(handleCreateAppointment({ repository, requester: null, body })).resolves.toMatchObject({
      status: 401,
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("un cuerpo inválido responde 400 sin eco de los datos del paciente", async () => {
    const repository = repositoryReturning(async () => ({ ok: true, code: "ART-ABCD23" }));
    const invalid = { ...body, patient: { ...body.patient, phone: "llámame" } };

    const result = await handleCreateAppointment({ repository, requester, body: invalid });

    expect(result.status).toBe(400);
    expect(JSON.stringify(result)).not.toContain("llámame");
  });

  it("el límite por hora responde 429 con la espera sugerida", async () => {
    const repository = repositoryReturning(async () => ({ ok: false, reason: "rate-limited" }));

    await expect(handleCreateAppointment({ repository, requester, body })).resolves.toMatchObject({
      status: 429,
      retryAfterSeconds: APPOINTMENT_RETRY_AFTER_SECONDS,
    });
  });

  it("un fallo de la base responde 503 para que la outbox reintente", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const repository = repositoryReturning(async () => {
      throw new RepositoryError("crear appointments");
    });

    await expect(handleCreateAppointment({ repository, requester, body })).resolves.toMatchObject({
      status: 503,
    });
  });
});
