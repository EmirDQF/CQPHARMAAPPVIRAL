import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import { ACCOUNT_DELETION_CONFIRMATION, handleArcoDelete, type AccountDeleter } from "@/lib/api/handleArcoDelete";
import { ARCO_HOURLY_LIMITS, ARCO_RETRY_AFTER_SECONDS, consumeArcoQuota } from "@/lib/api/arcoRateLimit";
import { handleArcoExport } from "@/lib/api/handleArcoExport";
import {
  createGuestPatient,
  createLocalClient,
  createPermanentPatient,
  readLocalSupabase,
  type TestPatient,
} from "./localSupabase";

let admin: SupabaseClient;
let status: ReturnType<typeof readLocalSupabase>;

function adminDeleter(): AccountDeleter {
  return {
    async deleteUser(userId) {
      const { error } = await admin.auth.admin.deleteUser(userId, false);
      return { error: error ? { message: error.message } : null };
    },
  };
}

async function seedPain(patient: TestPatient, logDate: string, painLevel: number): Promise<void> {
  const { error } = await patient.client.from("pain_logs").insert({ log_date: logDate, pain_level: painLevel, stiffness: "0-15" });
  expect(error).toBeNull();
}

beforeAll(async () => {
  status = readLocalSupabase();
  admin = createLocalClient(status, status.SERVICE_ROLE_KEY);
});

describe("ARCO: acceso (Supabase local)", () => {
  it("exporta todo lo propio y nada de otra cuenta", async () => {
    const [patientA, patientB] = await Promise.all([
      createPermanentPatient(status, admin),
      createPermanentPatient(status, admin),
    ]);
    await seedPain(patientA, "2026-03-01", 4);
    await seedPain(patientB, "2026-03-02", 7);

    const result = await handleArcoExport({
      client: patientA.client,
      requester: { id: patientA.userId, isAnonymous: false },
      consumeQuota: () => consumeArcoQuota(patientA.client, "export"),
    });

    expect(result.status).toBe(200);
    if (result.status !== 200) return;
    expect(result.data.diarioDeDolorYRigidez).toEqual([
      expect.objectContaining({ log_date: "2026-03-01", pain_level: 4, user_id: patientA.userId }),
    ]);
    expect(JSON.stringify(result.data)).not.toContain(patientB.userId);
  });

  it("incluye lo borrado en suave en la papelera", async () => {
    const patient = await createGuestPatient(status);
    await seedPain(patient, "2026-03-03", 2);
    const painId = (await patient.client.from("pain_logs").select("id").single()).data?.id;
    await patient.client.rpc("soft_delete_record", { p_table: "pain_logs", p_id: painId });

    const result = await handleArcoExport({
      client: patient.client,
      requester: { id: patient.userId, isAnonymous: true },
      consumeQuota: () => consumeArcoQuota(patient.client, "export"),
    });

    expect(result.status === 200 && result.data.papelera).toEqual([
      expect.objectContaining({ table_name: "pain_logs", record_id: painId }),
    ]);
  });

  it("la exportación 11 de la hora responde 429 con el cupo real de la base", async () => {
    const patient = await createGuestPatient(status);
    const exportOnce = () =>
      handleArcoExport({
        client: patient.client,
        requester: { id: patient.userId, isAnonymous: true },
        consumeQuota: () => consumeArcoQuota(patient.client, "export"),
      });

    for (let attempt = 0; attempt < ARCO_HOURLY_LIMITS.export; attempt += 1) {
      expect((await exportOnce()).status).toBe(200);
    }
    await expect(exportOnce()).resolves.toMatchObject({ status: 429, retryAfterSeconds: ARCO_RETRY_AFTER_SECONDS });
  });
});

describe("ARCO: cancelación (Supabase local)", () => {
  it("borra la cuenta de la sesión y en cascada sus datos, sin tocar a otra cuenta", async () => {
    const [patient, other] = await Promise.all([
      createPermanentPatient(status, admin),
      createPermanentPatient(status, admin),
    ]);
    await seedPain(patient, "2026-03-04", 5);
    await seedPain(other, "2026-03-04", 6);

    const result = await handleArcoDelete({
      requester: { id: patient.userId, isAnonymous: false },
      body: { confirmacion: ACCOUNT_DELETION_CONFIRMATION, userId: other.userId },
      deleter: adminDeleter(),
      consumeQuota: () => consumeArcoQuota(patient.client, "delete"),
    });

    expect(result).toEqual({ status: 200, data: { deleted: true } });
    const [patientRows, otherRows, authUser] = await Promise.all([
      admin.from("pain_logs").select("id").eq("user_id", patient.userId),
      admin.from("pain_logs").select("id").eq("user_id", other.userId),
      admin.auth.admin.getUserById(patient.userId),
    ]);
    expect(patientRows.data).toEqual([]);
    expect(otherRows.data).toHaveLength(1);
    expect(authUser.data.user).toBeNull();
  });

  it("sin la confirmación explícita no borra nada", async () => {
    const patient = await createPermanentPatient(status, admin);
    await seedPain(patient, "2026-03-05", 3);

    const result = await handleArcoDelete({
      requester: { id: patient.userId, isAnonymous: false },
      body: {},
      deleter: adminDeleter(),
      consumeQuota: () => consumeArcoQuota(patient.client, "delete"),
    });

    expect(result.status).toBe(400);
    expect((await admin.from("pain_logs").select("id").eq("user_id", patient.userId)).data).toHaveLength(1);
  });
});
