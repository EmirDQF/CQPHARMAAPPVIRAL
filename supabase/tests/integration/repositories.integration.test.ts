import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import { handleSyncBatch } from "@/lib/api/handleSyncBatch";
import { createSupabaseBottleRepository } from "@/lib/repositories/bottles";
import { createSupabaseConsentRepository } from "@/lib/repositories/consents";
import { createSupabaseDexaScanRepository } from "@/lib/repositories/dexaScans";
import { createSupabaseDoseEventRepository } from "@/lib/repositories/doseEvents";
import { createSupabasePainLogRepository } from "@/lib/repositories/painLogs";
import { createSupabaseProfileRepository } from "@/lib/repositories/profile";
import {
  createLocalClient,
  createPermanentPatient,
  readLocalSupabase,
  type TestPatient,
} from "./localSupabase";

/**
 * Repositorios de C3 contra el Supabase local: lo que el fake en memoria no
 * puede probar (PostgREST, RLS, triggers y tipos numéricos reales).
 */

let patientA: TestPatient;
let patientB: TestPatient;

beforeAll(async () => {
  const status = readLocalSupabase();
  const admin: SupabaseClient = createLocalClient(status, status.SERVICE_ROLE_KEY);
  patientA = await createPermanentPatient(status, admin);
  patientB = await createPermanentPatient(status, admin);
});

describe("repositorios Supabase (local)", () => {
  it("dolor: upsert idempotente por día con user_id por defecto, borrado suave y nuevo registro", async () => {
    const repository = createSupabasePainLogRepository(patientA.client);
    const entry = { date: "2026-03-01", painLevel: 4, stiffness: "0-15" as const };

    await repository.upsertMany([entry]);
    await repository.upsertMany([{ ...entry, painLevel: 6 }]);
    expect((await repository.list()).map((record) => record.value.painLevel)).toEqual([6]);

    await repository.deleteMany(["2026-03-01"]);
    expect(await repository.list()).toEqual([]);

    await repository.upsertMany([{ ...entry, painLevel: 2 }]);
    expect((await repository.list()).map((record) => record.value.painLevel)).toEqual([2]);
  });

  it("densitometría: los T-score vuelven como número (numeric de PostgREST)", async () => {
    const repository = createSupabaseDexaScanRepository(patientA.client);

    await repository.upsertMany([
      { date: "2026-02-10", lumbarTScore: -2.55, femoralNeckTScore: -1.2, radiologyCenter: "Centro A" },
    ]);

    expect((await repository.list()).map((record) => record.value)).toEqual([
      expect.objectContaining({ lumbarTScore: -2.55, femoralNeckTScore: -1.2 }),
    ]);
  });

  it("tomas y frascos: la unión no duplica ni reescribe", async () => {
    const doses = createSupabaseDoseEventRepository(patientA.client);
    const bottles = createSupabaseBottleRepository(patientA.client);
    const dose = { date: "2026-03-02", doseId: "morning-collagen" };
    const bottle = { productId: "citrato-magnesio-d3", startedOn: "2026-03-01" };

    await doses.upsertMany([dose]);
    await doses.upsertMany([dose]);
    await bottles.upsertMany([bottle]);
    await bottles.upsertMany([bottle]);

    expect((await doses.list()).map((record) => record.key)).toEqual(["2026-03-02|morning-collagen"]);
    expect((await bottles.list()).map((record) => record.key)).toEqual(["citrato-magnesio-d3|2026-03-01"]);
  });

  it("perfil: dos guardados actualizan la misma fila y el peso vuelve como número", async () => {
    const repository = createSupabaseProfileRepository(patientA.client);
    const profile = {
      name: "Paciente Prueba",
      age: 58,
      sex: "femenino" as const,
      weightKg: 64.5,
      hasFractureHistory: null,
      menopausalStatus: "posmenopausica" as const,
      allergies: "",
      phone: "",
    };

    await repository.upsertMany([profile]);
    await repository.upsertMany([{ ...profile, age: 59 }]);

    const records = await repository.list();
    expect(records).toHaveLength(1);
    expect(records[0].value).toMatchObject({ age: 59, weightKg: 64.5 });
  });

  it("RLS: el paciente B no ve nada de lo que respaldó A", async () => {
    expect(await createSupabasePainLogRepository(patientB.client).list()).toEqual([]);
    expect(await createSupabaseDexaScanRepository(patientB.client).list()).toEqual([]);
    expect(await createSupabaseProfileRepository(patientB.client).list()).toEqual([]);
  });

  it("/api/sync: sin consentimiento 403; con respaldo-cuenta en la base, guarda", async () => {
    const requester = { id: patientB.userId, isAnonymous: false };
    const body = {
      domain: "painLogs",
      upserts: [{ date: "2026-03-05", painLevel: 3, stiffness: "15-30" }],
      deletes: [],
      consent: { consentAt: "2026-03-05T12:00:00.000Z", consentVersion: "2026-09-24-provisional" },
    };

    await expect(handleSyncBatch({ client: patientB.client, requester, body })).resolves.toMatchObject({ status: 403 });

    await createSupabaseConsentRepository(patientB.client).record({
      purpose: "respaldo-cuenta",
      policy_version: "2026-09-24-provisional",
      granted_at: "2026-03-05T12:00:00.000Z",
      revoked_at: null,
    });

    await expect(handleSyncBatch({ client: patientB.client, requester, body })).resolves.toMatchObject({ status: 200 });
    expect((await createSupabasePainLogRepository(patientB.client).list()).map((record) => record.key)).toEqual([
      "2026-03-05",
    ]);
  });
});
