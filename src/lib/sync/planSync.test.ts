import { describe, expect, it } from "vitest";
import type { SyncRecord } from "@/lib/repositories/types";
import { planDomainSync, type DomainSyncInput } from "./planSync";

interface Reading {
  date: string;
  level: number;
  updatedAt?: string;
}

const fingerprint = (reading: Reading) => `${reading.date}:${reading.level}`;

function record(level: number, updatedAt: string | null = null, date = "2026-10-01"): SyncRecord<Reading> {
  return { key: date, value: { date, level, ...(updatedAt ? { updatedAt } : {}) }, updatedAt };
}

function plan(overrides: Partial<DomainSyncInput<Reading>>) {
  return planDomainSync<Reading>({
    local: [],
    remote: [],
    base: {},
    rule: "latest-updated-at",
    supportsDelete: true,
    fingerprint,
    ...overrides,
  });
}

const EARLY = "2026-10-01T10:00:00.000Z";
const LATE = "2026-10-02T10:00:00.000Z";

describe("planDomainSync: primera sincronización (sin base)", () => {
  it("sube lo que solo existe en el celular", () => {
    const result = plan({ local: [record(3)] });

    expect(result.uploadRemote).toEqual([record(3).value]);
    expect(result.applyLocal).toEqual([]);
  });

  it("baja lo que solo existe en la cuenta", () => {
    const result = plan({ remote: [record(4, LATE)] });

    expect(result.applyLocal).toEqual([record(4, LATE).value]);
    expect(result.nextBase).toEqual({ "2026-10-01": "2026-10-01:4" });
  });

  it("sin base nunca infiere borrados: nada se pierde al primer login", () => {
    const result = plan({ local: [record(3)], remote: [record(5, LATE, "2026-10-02")] });

    expect(result.deleteLocal).toEqual([]);
    expect(result.deleteRemote).toEqual([]);
  });

  it("conflicto: gana el updatedAt más reciente", () => {
    expect(plan({ local: [record(3, LATE)], remote: [record(7, EARLY)] }).uploadRemote).toEqual([
      record(3, LATE).value,
    ]);
    expect(plan({ local: [record(3, EARLY)], remote: [record(7, LATE)] }).applyLocal).toEqual([
      record(7, LATE).value,
    ]);
  });

  it("un registro local sin fecha de edición (previo a C3) pierde ante la cuenta", () => {
    const result = plan({ local: [record(3, null)], remote: [record(7, EARLY)] });

    expect(result.applyLocal).toEqual([record(7, EARLY).value]);
    expect(result.uploadRemote).toEqual([]);
  });

  it("valores iguales no generan trabajo y quedan en la base", () => {
    const result = plan({ local: [record(3, EARLY)], remote: [record(3, LATE)] });

    expect(result).toMatchObject({ applyLocal: [], uploadRemote: [], deleteLocal: [], deleteRemote: [] });
    expect(result.nextBase).toEqual({ "2026-10-01": "2026-10-01:3" });
  });
});

describe("planDomainSync: con base (sincronizaciones siguientes)", () => {
  const base = { "2026-10-01": "2026-10-01:3" };

  it("solo cambió el celular: se sube aunque la cuenta tenga una hora más nueva", () => {
    const result = plan({ base, local: [record(5, EARLY)], remote: [record(3, LATE)] });

    expect(result.uploadRemote).toEqual([record(5, EARLY).value]);
  });

  it("solo cambió la cuenta: se baja", () => {
    const result = plan({ base, local: [record(3, LATE)], remote: [record(6, EARLY)] });

    expect(result.applyLocal).toEqual([record(6, EARLY).value]);
  });

  it("borrado en otro celular y sin cambios aquí: se borra aquí (a la papelera)", () => {
    const result = plan({ base, local: [record(3)] });

    expect(result.deleteLocal).toEqual(["2026-10-01"]);
    expect(result.nextBase).toEqual({});
  });

  it("borrado en otro celular pero editado aquí: la edición gana y se vuelve a subir", () => {
    const result = plan({ base, local: [record(8, LATE)] });

    expect(result.deleteLocal).toEqual([]);
    expect(result.uploadRemote).toEqual([record(8, LATE).value]);
  });

  it("borrado aquí y sin cambios en la cuenta: se borra en la cuenta", () => {
    const result = plan({ base, remote: [record(3, EARLY)] });

    expect(result.deleteRemote).toEqual(["2026-10-01"]);
  });

  it("borrado aquí pero editado en la cuenta: la edición gana y se baja", () => {
    const result = plan({ base, remote: [record(9, LATE)] });

    expect(result.deleteRemote).toEqual([]);
    expect(result.applyLocal).toEqual([record(9, LATE).value]);
  });

  it("borrado en ambos lados: sale de la base", () => {
    expect(plan({ base }).nextBase).toEqual({});
  });
});

describe("planDomainSync: la base solo avanza con lo confirmado por ambos lados", () => {
  it("lo pendiente de subir conserva la base anterior (si el envío falla, se reintenta)", () => {
    const base = { "2026-10-01": "2026-10-01:3" };

    const result = plan({ base, local: [record(5, LATE)], remote: [record(3, EARLY)] });

    expect(result.nextBase).toEqual(base);
  });

  it("un registro nuevo pendiente de subir no entra en la base", () => {
    const afterFailedUpload = plan({ local: [record(3)] });
    const retry = plan({ base: afterFailedUpload.nextBase, local: [record(3)] });

    expect(afterFailedUpload.nextBase).toEqual({});
    expect(retry.deleteLocal).toEqual([]);
    expect(retry.uploadRemote).toEqual([record(3).value]);
  });

  it("un borrado remoto pendiente conserva su base hasta que la cuenta lo confirme", () => {
    const base = { "2026-10-01": "2026-10-01:3" };

    const result = plan({ base, remote: [record(3, EARLY)] });

    expect(result.nextBase).toEqual(base);
  });
});

describe("planDomainSync: regla de unión (tomas y frascos)", () => {
  it("une ambos lados y nunca borra, aunque falte en uno con base", () => {
    const result = plan({
      rule: "union",
      supportsDelete: false,
      base: { "2026-10-01": "2026-10-01:1", "2026-10-02": "2026-10-02:1" },
      local: [record(1, null, "2026-10-01")],
      remote: [record(1, null, "2026-10-02")],
    });

    expect(result.uploadRemote).toEqual([record(1, null, "2026-10-01").value]);
    expect(result.applyLocal).toEqual([record(1, null, "2026-10-02").value]);
    expect(result.deleteLocal).toEqual([]);
    expect(result.deleteRemote).toEqual([]);
  });
});
