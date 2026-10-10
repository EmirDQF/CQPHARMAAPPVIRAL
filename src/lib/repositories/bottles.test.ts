// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bottlesStore } from "@/lib/dashboard/bottles";
import { createFakeSupabase, type FakeSupabase } from "@/test/fakeSupabase";
import { createLocalBottleRepository, createSupabaseBottleRepository } from "./bottles";
import type { RepositoryClient } from "./supabaseRows";

const NOW = new Date("2026-10-10T15:00:00.000Z");
const bottle = { productId: "citrato-magnesio-d3", startedOn: "2026-09-01" };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  bottlesStore.write({ bottles: [] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("LocalBottleRepository", () => {
  const repository = createLocalBottleRepository();

  it("lista cada frasco por producto y fecha de inicio", async () => {
    bottlesStore.write({ bottles: [bottle] });

    await expect(repository.list()).resolves.toEqual([
      { key: "citrato-magnesio-d3|2026-09-01", value: bottle, updatedAt: null },
    ]);
  });

  it("une los frascos remotos sin duplicar los que ya estaban", async () => {
    bottlesStore.write({ bottles: [bottle] });
    const remote = { productId: "colageno-vitamina-c", startedOn: "2026-09-15" };

    await repository.upsertMany([bottle, remote]);

    expect(bottlesStore.getSnapshot().bottles).toEqual([bottle, remote]);
  });
});

describe("SupabaseBottleRepository", () => {
  let fake: FakeSupabase;
  let repository: ReturnType<typeof createSupabaseBottleRepository>;

  beforeEach(() => {
    fake = createFakeSupabase();
    repository = createSupabaseBottleRepository(fake.client as unknown as RepositoryClient);
  });

  it("sube y vuelve a leer el frasco", async () => {
    await repository.upsertMany([bottle]);

    await expect(repository.list()).resolves.toEqual([
      { key: "citrato-magnesio-d3|2026-09-01", value: bottle, updatedAt: null },
    ]);
  });

  it("reintentar el mismo frasco no crea otro", async () => {
    await repository.upsertMany([bottle]);
    await repository.upsertMany([bottle]);

    expect(fake.rows("bottles")).toHaveLength(1);
  });

  it("descarta un frasco con fecha de inicio futura", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    await repository.upsertMany([{ ...bottle, startedOn: "2026-10-11" }]);

    expect(fake.rows("bottles")).toEqual([]);
  });
});
