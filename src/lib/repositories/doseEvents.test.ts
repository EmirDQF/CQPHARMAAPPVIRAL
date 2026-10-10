// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pillboxStore } from "@/lib/dashboard/pillbox";
import { createFakeSupabase, type FakeSupabase } from "@/test/fakeSupabase";
import {
  createLocalDoseEventRepository,
  createSupabaseDoseEventRepository,
  scheduledTakenAt,
} from "./doseEvents";
import type { RepositoryClient } from "./supabaseRows";

// 10:00 en Lima (UTC-5): la toma de la mañana ya pasó, la de la noche no.
const NOW = new Date("2026-10-10T15:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  pillboxStore.write({ takenDoseIdsByDate: {} });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("scheduledTakenAt", () => {
  it("usa la hora programada del día en Lima", () => {
    expect(scheduledTakenAt("2026-10-09", "21:30", NOW)).toBe("2026-10-10T02:30:00.000Z");
  });

  it("nunca queda en el futuro: una toma adelantada de hoy usa la hora actual", () => {
    expect(scheduledTakenAt("2026-10-10", "21:30", NOW)).toBe(NOW.toISOString());
  });
});

describe("LocalDoseEventRepository", () => {
  const repository = createLocalDoseEventRepository();

  it("lista una toma por día y horario", async () => {
    pillboxStore.write({ takenDoseIdsByDate: { "2026-10-09": ["morning-collagen", "night-magnesium"] } });

    await expect(repository.list()).resolves.toEqual([
      { key: "2026-10-09|morning-collagen", value: { date: "2026-10-09", doseId: "morning-collagen" }, updatedAt: null },
      { key: "2026-10-09|night-magnesium", value: { date: "2026-10-09", doseId: "night-magnesium" }, updatedAt: null },
    ]);
  });

  it("une las tomas remotas con las locales sin duplicar ni perder ninguna", async () => {
    pillboxStore.write({ takenDoseIdsByDate: { "2026-10-09": ["morning-collagen"] } });

    await repository.upsertMany([
      { date: "2026-10-09", doseId: "morning-collagen" },
      { date: "2026-10-09", doseId: "night-magnesium" },
      { date: "2026-10-08", doseId: "night-magnesium" },
    ]);

    expect(pillboxStore.getSnapshot().takenDoseIdsByDate).toEqual({
      "2026-10-08": ["night-magnesium"],
      "2026-10-09": ["morning-collagen", "night-magnesium"],
    });
  });
});

describe("SupabaseDoseEventRepository", () => {
  let fake: FakeSupabase;
  let repository: ReturnType<typeof createSupabaseDoseEventRepository>;

  beforeEach(() => {
    fake = createFakeSupabase();
    repository = createSupabaseDoseEventRepository(fake.client as unknown as RepositoryClient);
  });

  it("sube la toma con su producto del catálogo y la hora programada", async () => {
    await repository.upsertMany([{ date: "2026-10-09", doseId: "morning-collagen" }]);

    expect(fake.rows("dose_events")).toEqual([
      expect.objectContaining({
        dose_id: "morning-collagen",
        product_id: "colageno-vitamina-c",
        taken_on: "2026-10-09",
        taken_at: "2026-10-09T13:30:00.000Z",
      }),
    ]);
    await expect(repository.list()).resolves.toEqual([
      { key: "2026-10-09|morning-collagen", value: { date: "2026-10-09", doseId: "morning-collagen" }, updatedAt: null },
    ]);
  });

  it("unión: reintentar no duplica ni cambia la toma que ya estaba", async () => {
    fake.seed("dose_events", [
      { dose_id: "morning-collagen", product_id: "colageno-vitamina-c", taken_on: "2026-10-09", taken_at: "2026-10-09T12:00:00.000Z" },
    ]);

    await repository.upsertMany([{ date: "2026-10-09", doseId: "morning-collagen" }]);

    expect(fake.rows("dose_events")).toEqual([
      expect.objectContaining({ taken_at: "2026-10-09T12:00:00.000Z" }),
    ]);
  });

  it("descarta un horario que no existe en el catálogo", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    await repository.upsertMany([{ date: "2026-10-09", doseId: "noon-unknown" }]);

    expect(fake.rows("dose_events")).toEqual([]);
  });
});
