import { describe, expect, it } from "vitest";
import { SYNC_BATCH_MAX_ITEMS, SYNC_DOMAINS, syncBatchBodySchema } from "./domains";

const consent = { consentAt: "2026-10-10T12:00:00.000Z", consentVersion: "2026-09-24-provisional" };

describe("SYNC_DOMAINS", () => {
  it("aplica la regla del plan a cada dominio", () => {
    expect(SYNC_DOMAINS.painLogs).toMatchObject({ rule: "latest-updated-at", supportsDelete: true });
    expect(SYNC_DOMAINS.dexaScans).toMatchObject({ rule: "latest-updated-at", supportsDelete: true });
    expect(SYNC_DOMAINS.profile).toMatchObject({ rule: "latest-updated-at", supportsDelete: false });
    expect(SYNC_DOMAINS.doseEvents).toMatchObject({ rule: "union", supportsDelete: false });
    expect(SYNC_DOMAINS.bottles).toMatchObject({ rule: "union", supportsDelete: false });
  });

  it("la huella ignora cuándo se editó: el mismo dato en dos celulares es el mismo", () => {
    const reading = { date: "2026-10-01", painLevel: 3, stiffness: "0-15" as const };

    expect(SYNC_DOMAINS.painLogs.fingerprint({ ...reading, updatedAt: "2026-10-01T10:00:00.000Z" })).toBe(
      SYNC_DOMAINS.painLogs.fingerprint(reading)
    );
  });

  it("la huella cambia con cualquier valor clínico", () => {
    const scan = {
      date: "2026-08-15",
      lumbarTScore: -1.6,
      femoralNeckTScore: -1.2,
      radiologyCenter: "Centro A",
    };

    expect(SYNC_DOMAINS.dexaScans.fingerprint(scan)).not.toBe(
      SYNC_DOMAINS.dexaScans.fingerprint({ ...scan, femoralNeckTScore: -2.5 })
    );
  });
});

describe("syncBatchBodySchema", () => {
  it("acepta un lote de dolor con altas y borrados", () => {
    const body = {
      domain: "painLogs",
      upserts: [{ date: "2026-10-01", painLevel: 3, stiffness: "0-15" }],
      deletes: ["2026-09-30"],
      consent,
    };

    expect(syncBatchBodySchema.safeParse(body).success).toBe(true);
  });

  it("rechaza borrados en un dominio de unión (las tomas no se borran)", () => {
    const body = { domain: "doseEvents", upserts: [], deletes: ["2026-10-01|morning-collagen"], consent };

    expect(syncBatchBodySchema.safeParse(body).success).toBe(false);
  });

  it("rechaza un lote sin consentimiento", () => {
    expect(syncBatchBodySchema.safeParse({ domain: "bottles", upserts: [], deletes: [] }).success).toBe(false);
  });

  it("rechaza lotes más grandes que el máximo", () => {
    const bottle = { productId: "citrato-magnesio-d3", startedOn: "2026-09-01" };
    const body = {
      domain: "bottles",
      upserts: Array.from({ length: SYNC_BATCH_MAX_ITEMS + 1 }, () => bottle),
      deletes: [],
      consent,
    };

    expect(syncBatchBodySchema.safeParse(body).success).toBe(false);
  });

  it("rechaza un dominio desconocido", () => {
    expect(syncBatchBodySchema.safeParse({ domain: "appointments", upserts: [], deletes: [], consent }).success).toBe(
      false
    );
  });
});
