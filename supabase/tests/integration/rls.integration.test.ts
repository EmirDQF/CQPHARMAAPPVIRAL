import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { addDaysToIsoDate, toLimaIsoDate } from "../../../src/lib/utils/date";
import {
  createGuestPatient,
  createLocalClient,
  createPermanentPatient,
  readLocalSupabase,
  type TestPatient,
} from "./localSupabase";

const CHECK_VIOLATION = "23514";
const INSUFFICIENT_PRIVILEGE = "42501";
const NOT_FOUND = "P0002";

const OWNED_TABLES = [
  "profiles",
  "consents",
  "assessments",
  "dexa_scans",
  "pain_logs",
  "dose_events",
  "bottles",
  "appointments",
] as const;

let admin: SupabaseClient;
let noSession: SupabaseClient;
let patientA: TestPatient | undefined;
let guestB: TestPatient | undefined;

function requirePatient(patient: TestPatient | undefined): TestPatient {
  if (!patient) throw new Error("beforeAll no creó los pacientes de prueba");
  return patient;
}

beforeAll(async () => {
  const status = readLocalSupabase();
  admin = createLocalClient(status, status.SERVICE_ROLE_KEY);
  noSession = createLocalClient(status, status.ANON_KEY);
  patientA = await createPermanentPatient(status, admin);
  guestB = await createGuestPatient(status);

  const a = patientA.client;
  const writes = await Promise.all([
    a.from("profiles").insert({ name: "Paciente A", age: 58, sex: "femenino" }),
    a.from("consents").insert({
      purpose: "perfil-clinico",
      policy_version: "v-test",
      granted_at: new Date().toISOString(),
    }),
    a.from("assessments").insert({
      chronological_age: 58,
      articular_age: 66,
      risk_level: "moderado",
      answers: { rigidez: "mas-15" },
    }),
    a.from("dexa_scans").insert({ scan_date: "2026-01-10", lumbar_t: -2.6, femoral_t: -1.9 }),
    a.from("pain_logs").insert({ log_date: "2026-01-10", pain_level: 6, stiffness: "15-30" }),
    a.from("dose_events").insert({
      dose_id: "night-magnesium",
      product_id: "citrato-magnesio-d3",
      taken_on: "2026-01-10",
    }),
    a.from("bottles").insert({ product_id: "citrato-magnesio-d3", started_on: "2026-01-10" }),
  ]);
  for (const { error } of writes) expect(error).toBeNull();
});

afterAll(async () => {
  // Borrar el usuario de auth elimina en cascada todos sus registros.
  const createdUserIds = [patientA, guestB]
    .filter((patient): patient is TestPatient => patient !== undefined)
    .map((patient) => patient.userId);
  await Promise.all(createdUserIds.map((userId) => admin.auth.admin.deleteUser(userId)));
});

describe("RLS vía PostgREST (Supabase local)", () => {
  it("A ve sus propios registros", async () => {
    const a = requirePatient(patientA);
    const { data, error } = await a.client.from("dexa_scans").select("lumbar_t, user_id");
    expect(error).toBeNull();
    expect(data).toEqual([{ lumbar_t: -2.6, user_id: a.userId }]);
  });

  it.each(OWNED_TABLES)("el invitado B no ve nada de A en %s", async (table) => {
    const { data, error } = await requirePatient(guestB).client.from(table).select("*");
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("B no edita ni borra lo de A", async () => {
    const a = requirePatient(patientA);
    const b = requirePatient(guestB);

    const update = await b.client
      .from("pain_logs")
      .update({ pain_level: 0 })
      .eq("user_id", a.userId)
      .select();
    expect(update.data).toEqual([]);

    // Nadie tiene DELETE directo: el borrado del paciente es suave y va por RPC.
    const removal = await b.client.from("dexa_scans").delete().eq("user_id", a.userId).select();
    expect(removal.error?.code).toBe(INSUFFICIENT_PRIVILEGE);
    const softRemoval = await b.client.rpc("soft_delete_record", {
      p_table: "pain_logs",
      p_id: (await a.client.from("pain_logs").select("id").single()).data?.id,
    });
    expect(softRemoval.error?.code).toBe(NOT_FOUND);

    const [pain, dexa] = await Promise.all([
      a.client.from("pain_logs").select("pain_level"),
      a.client.from("dexa_scans").select("id"),
    ]);
    expect(pain.data).toEqual([{ pain_level: 6 }]);
    expect(dexa.data).toHaveLength(1);
  });

  it("B no puede insertar a nombre de A", async () => {
    const { error } = await requirePatient(guestB)
      .client.from("pain_logs")
      .insert({
        user_id: requirePatient(patientA).userId,
        log_date: "2026-02-01",
        pain_level: 3,
        stiffness: "0-15",
      });
    expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE);
  });

  it.each([...OWNED_TABLES, "products"])("sin sesión (anon) no se lee %s", async (table) => {
    const { data, error } = await noSession.from(table).select("*");
    expect(data).toBeNull();
    expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE);
  });

  it("el invitado lee el catálogo, pero no puede escribir en él", async () => {
    const b = requirePatient(guestB);
    const read = await b.client.from("products").select("id").order("id");
    expect(read.data).toEqual([{ id: "citrato-magnesio-d3" }, { id: "colageno-vitamina-c" }]);

    const write = await b.client
      .from("products")
      .insert({ id: "x", name: "X", composition: ["x"], doses_per_bottle: 1 });
    expect(write.error?.code).toBe(INSUFFICIENT_PRIVILEGE);
  });

  it("nadie inserta citas directamente (solo por la RPC de C4)", async () => {
    const { error } = await requirePatient(patientA).client.from("appointments").insert({
      code: "ART-ABCDEF",
      service_id: "densitometria",
      appointment_date: "2026-12-01",
      slot: "manana",
      patient_name: "Paciente A",
      patient_age: 58,
      patient_phone: "987654321",
      booked_by: "propia",
      consent_version: "v-test",
      consent_at: new Date().toISOString(),
    });
    expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE);
  });
});

describe("CHECK clínicos vía PostgREST", () => {
  it("rechaza T-score -6.1", async () => {
    const { error } = await requirePatient(patientA)
      .client.from("dexa_scans")
      .insert({ scan_date: "2026-02-01", lumbar_t: -6.1, femoral_t: -1 });
    expect(error?.code).toBe(CHECK_VIOLATION);
  });

  it("rechaza dolor 11", async () => {
    const { error } = await requirePatient(patientA)
      .client.from("pain_logs")
      .insert({ log_date: "2026-02-01", pain_level: 11, stiffness: "0-15" });
    expect(error?.code).toBe(CHECK_VIOLATION);
  });

  it("rechaza fechas futuras según el día de Lima", async () => {
    const a = requirePatient(patientA).client;
    const tomorrowInLima = addDaysToIsoDate(toLimaIsoDate(), 1);
    const [dexa, pain, dose] = await Promise.all([
      a.from("dexa_scans").insert({ scan_date: tomorrowInLima, lumbar_t: -1, femoral_t: -1 }),
      a.from("pain_logs").insert({ log_date: tomorrowInLima, pain_level: 3, stiffness: "0-15" }),
      a.from("dose_events").insert({
        dose_id: "morning-collagen",
        product_id: "colageno-vitamina-c",
        taken_on: tomorrowInLima,
      }),
    ]);
    expect(dexa.error?.code).toBe(CHECK_VIOLATION);
    expect(pain.error?.code).toBe(CHECK_VIOLATION);
    expect(dose.error?.code).toBe(CHECK_VIOLATION);
  });
});
