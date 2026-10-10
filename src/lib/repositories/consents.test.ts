import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase, type FakeSupabase } from "@/test/fakeSupabase";
import { createSupabaseConsentRepository, isConsentActive } from "./consents";
import type { RepositoryClient } from "./supabaseRows";
import { RepositoryError } from "./types";

const NOW = new Date("2026-10-10T15:00:00.000Z");
const grant = {
  purpose: "respaldo-cuenta" as const,
  policy_version: "2026-09-24-provisional",
  granted_at: "2026-10-01T12:00:00.000Z",
  revoked_at: null,
};
const revocation = { ...grant, revoked_at: "2026-10-05T12:00:00.000Z" };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("isConsentActive", () => {
  it("sin filas no hay consentimiento", () => {
    expect(isConsentActive([], "respaldo-cuenta")).toBe(false);
  });

  it("un consentimiento dado y no revocado está vigente", () => {
    expect(isConsentActive([grant], "respaldo-cuenta")).toBe(true);
  });

  it("una revocación posterior lo anula", () => {
    expect(isConsentActive([grant, revocation], "respaldo-cuenta")).toBe(false);
  });

  it("volver a darlo después de revocarlo lo reactiva", () => {
    const regrant = { ...grant, granted_at: "2026-10-08T12:00:00.000Z" };

    expect(isConsentActive([grant, revocation, regrant], "respaldo-cuenta")).toBe(true);
  });

  it("el consentimiento de otra finalidad no cuenta", () => {
    expect(isConsentActive([{ ...grant, purpose: "cita" }], "respaldo-cuenta")).toBe(false);
  });
});

describe("SupabaseConsentRepository", () => {
  let fake: FakeSupabase;
  let repository: ReturnType<typeof createSupabaseConsentRepository>;

  beforeEach(() => {
    fake = createFakeSupabase();
    repository = createSupabaseConsentRepository(fake.client as unknown as RepositoryClient);
  });

  it("registra el consentimiento y lo reconoce como vigente", async () => {
    await repository.record(grant);

    expect(fake.rows("consents")).toEqual([expect.objectContaining(grant)]);
    await expect(repository.hasActive("respaldo-cuenta")).resolves.toBe(true);
  });

  it("un consentimiento inválido no se descarta en silencio: falla", async () => {
    const future = { ...grant, granted_at: "2026-10-11T00:00:00.000Z" };

    await expect(repository.record(future)).rejects.toBeInstanceOf(RepositoryError);
    expect(fake.rows("consents")).toEqual([]);
  });

  it("si la base falla al consultarlo, no se asume vigente", async () => {
    fake.failNext("select");

    await expect(repository.hasActive("respaldo-cuenta")).rejects.toBeInstanceOf(RepositoryError);
  });
});
