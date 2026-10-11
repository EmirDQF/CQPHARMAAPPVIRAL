import { describe, expect, it } from "vitest";
import { REWARD_CATALOG } from "./catalog";
import { createLocalRewardCatalogRepository, parseCatalogOrFallback } from "./repository";

describe("reward catalog repository", () => {
  it("serves the validated local catalog", async () => {
    await expect(createLocalRewardCatalogRepository().load()).resolves.toBe(REWARD_CATALOG);
  });

  it("falls back to the local catalog when remote data is invalid", () => {
    expect(parseCatalogOrFallback([{ id: "x" }])).toBe(REWARD_CATALOG);
    expect(parseCatalogOrFallback([REWARD_CATALOG[0]])).toEqual([REWARD_CATALOG[0]]);
  });
});
