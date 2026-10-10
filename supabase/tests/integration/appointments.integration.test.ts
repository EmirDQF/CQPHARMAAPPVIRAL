import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import { APPOINTMENT_CODE_PATTERN, generateAppointmentCode } from "@/lib/appointments/generateCode";
import {
  createSupabaseAppointmentRepository,
  type AppointmentRequest,
} from "@/lib/repositories/appointments";
import { createSupabaseAssessmentRepository } from "@/lib/repositories/assessments";
import { APPOINTMENT_HOURLY_LIMIT } from "@/lib/schemas/appointment";
import {
  createGuestPatient,
  createLocalClient,
  createPermanentPatient,
  readLocalSupabase,
  type TestPatient,
} from "./localSupabase";

/** C4 contra el Supabase local: RPC create_appointment, límite por hora y RLS. */

let status: ReturnType<typeof readLocalSupabase>;
let admin: SupabaseClient;

function request(code?: string): AppointmentRequest {
  return {
    code,
    serviceId: "densitometria",
    date: "2026-10-20",
    slot: "manana",
    patient: { name: "Paciente Prueba", age: 58, phone: "987654321", bookedBy: "propia" },
    consent: { consentAt: "2026-10-10T12:00:00.000Z", consentVersion: "2026-09-24-provisional" },
  };
}

async function newPatient(): Promise<TestPatient> {
  return createPermanentPatient(status, admin);
}

beforeAll(() => {
  status = readLocalSupabase();
  admin = createLocalClient(status, status.SERVICE_ROLE_KEY);
});

describe("create_appointment (Supabase local)", () => {
  it("acepta el código que propuso el celular", async () => {
    const patient = await newPatient();
    const code = generateAppointmentCode();

    await expect(createSupabaseAppointmentRepository(patient.client).create(request(code))).resolves.toEqual({
      ok: true,
      code,
    });
  });

  it("el reintento de la misma cita devuelve el mismo código y no crea otra", async () => {
    const patient = await newPatient();
    const repository = createSupabaseAppointmentRepository(patient.client);
    const code = generateAppointmentCode();

    await repository.create(request(code));
    await expect(repository.create(request(code))).resolves.toEqual({ ok: true, code });

    const { data } = await patient.client.from("appointments").select("code");
    expect(data).toEqual([{ code }]);
  });

  it("si el código ya es de otra persona, genera otro válido y lo devuelve", async () => {
    const owner = await newPatient();
    const other = await newPatient();
    const code = generateAppointmentCode();
    await createSupabaseAppointmentRepository(owner.client).create(request(code));

    const result = await createSupabaseAppointmentRepository(other.client).create(request(code));

    expect(result.ok && result.code).not.toBe(code);
    expect(result.ok && APPOINTMENT_CODE_PATTERN.test(result.code)).toBe(true);
  });

  it("sin código o con uno fuera del alfabeto, la base genera uno válido", async () => {
    const patient = await newPatient();
    const repository = createSupabaseAppointmentRepository(patient.client);

    const generated = await repository.create(request(undefined));
    const replaced = await repository.create(request("ART-IIII00"));

    expect(generated.ok && APPOINTMENT_CODE_PATTERN.test(generated.code)).toBe(true);
    expect(replaced.ok && APPOINTMENT_CODE_PATTERN.test(replaced.code)).toBe(true);
  });

  it(`la cita ${APPOINTMENT_HOURLY_LIMIT + 1} en una hora se rechaza (rate-limited)`, async () => {
    const patient = await newPatient();
    const repository = createSupabaseAppointmentRepository(patient.client);
    for (let index = 0; index < APPOINTMENT_HOURLY_LIMIT; index += 1) {
      await expect(repository.create(request(generateAppointmentCode()))).resolves.toMatchObject({ ok: true });
    }

    await expect(repository.create(request(generateAppointmentCode()))).resolves.toEqual({
      ok: false,
      reason: "rate-limited",
    });
  });

  it("un invitado con sesión anónima puede agendar (invitado primero)", async () => {
    const guest = await createGuestPatient(status);

    await expect(
      createSupabaseAppointmentRepository(guest.client).create(request(generateAppointmentCode()))
    ).resolves.toMatchObject({ ok: true });
  });

  it("RLS: un paciente no ve las citas de otro", async () => {
    const owner = await newPatient();
    const other = await newPatient();
    await createSupabaseAppointmentRepository(owner.client).create(request(generateAppointmentCode()));

    const { data } = await other.client.from("appointments").select("code");

    expect(data).toEqual([]);
  });

  it("nadie inserta citas directo: solo por la RPC", async () => {
    const patient = await newPatient();

    const { error } = await patient.client.from("appointments").insert({
      code: generateAppointmentCode(),
      service_id: "densitometria",
      appointment_date: "2026-10-20",
      slot: "manana",
      patient_name: "Paciente Prueba",
      patient_age: 58,
      patient_phone: "987654321",
      booked_by: "propia",
      consent_version: "2026-09-24-provisional",
      consent_at: "2026-10-10T12:00:00.000Z",
    });

    expect(error).not.toBeNull();
  });
});

describe("assessments (Supabase local)", () => {
  it("un invitado guarda el resumen del test una sola vez aunque se reintente", async () => {
    const guest = await createGuestPatient(status);
    const repository = createSupabaseAssessmentRepository(guest.client);
    const summary = { id: crypto.randomUUID(), chronologicalAge: 52, articularAge: 63, riskLevel: "moderado" as const };

    await repository.record(summary);
    await repository.record(summary);

    const { data } = await guest.client.from("assessments").select("id, answers");
    expect(data).toEqual([{ id: summary.id, answers: {} }]);
  });
});
