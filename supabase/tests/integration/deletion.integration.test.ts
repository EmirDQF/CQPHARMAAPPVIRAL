import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import {
  createGuestPatient,
  createLocalClient,
  readLocalSupabase,
  type TestPatient,
} from "./localSupabase";

let admin: SupabaseClient;
let patient: TestPatient;

beforeAll(async () => {
  const status = readLocalSupabase();
  admin = createLocalClient(status, status.SERVICE_ROLE_KEY);
  patient = await createGuestPatient(status);
});

describe("borrado suave vía RPC (Supabase local)", () => {
  it("oculta, lista en la papelera y restaura un registro propio", async () => {
    const inserted = await patient.client
      .from("dexa_scans")
      .insert({ scan_date: "2026-03-01", lumbar_t: -2.7, femoral_t: -2.0 })
      .select("id")
      .single();
    expect(inserted.error).toBeNull();
    const id = inserted.data?.id;

    expect((await patient.client.rpc("soft_delete_record", { p_table: "dexa_scans", p_id: id })).error).toBeNull();
    expect((await patient.client.from("dexa_scans").select("id")).data).toEqual([]);

    const trash = await patient.client.rpc("list_deleted_records");
    expect(trash.data).toEqual([expect.objectContaining({ table_name: "dexa_scans", record_id: id })]);

    expect((await patient.client.rpc("restore_record", { p_table: "dexa_scans", p_id: id })).error).toBeNull();
    expect((await patient.client.from("dexa_scans").select("id")).data).toEqual([{ id }]);
  });
});

describe("borrado de cuenta (derecho de cancelación, Ley 29733)", () => {
  it("es HARD DELETE de todo lo clínico y deja solo la prueba seudonimizada del consentimiento", async () => {
    const policyVersion = `v-${randomUUID()}`;
    const writes = await Promise.all([
      patient.client.from("pain_logs").insert({ log_date: "2026-03-02", pain_level: 3, stiffness: "0-15" }),
      patient.client.from("consents").insert({
        purpose: "perfil-clinico",
        policy_version: policyVersion,
        granted_at: new Date().toISOString(),
      }),
    ]);
    for (const { error } of writes) expect(error).toBeNull();

    const painId = (await patient.client.from("pain_logs").select("id").single()).data?.id;
    await patient.client.rpc("soft_delete_record", { p_table: "pain_logs", p_id: painId });

    const deletion = await admin.auth.admin.deleteUser(patient.userId);
    expect(deletion.error).toBeNull();

    const [dexa, pain, consents, proofs] = await Promise.all([
      admin.from("dexa_scans").select("id").eq("user_id", patient.userId),
      admin.from("pain_logs").select("id").eq("user_id", patient.userId),
      admin.from("consents").select("id").eq("user_id", patient.userId),
      admin.from("consent_proofs").select("*").eq("policy_version", policyVersion),
    ]);
    expect(dexa.data).toEqual([]);
    // Incluye el registro que estaba borrado suave: el borrado suave no impide el derecho de cancelación.
    expect(pain.data).toEqual([]);
    expect(consents.data).toEqual([]);

    expect(proofs.data).toHaveLength(1);
    const [proof] = proofs.data ?? [];
    expect(proof.subject_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(proof.subject_hash).not.toContain(patient.userId.replaceAll("-", ""));
    expect(proof.revoked_at).not.toBeNull();
    expect(Object.keys(proof).sort()).toEqual(
      ["created_at", "granted_at", "id", "policy_version", "purpose", "revoked_at", "subject_hash"]
    );
  });
});
