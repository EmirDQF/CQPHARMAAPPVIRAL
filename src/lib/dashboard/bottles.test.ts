// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  bottlesStore,
  currentBottleStart,
  parseBottlesState,
  startNewBottle,
} from "./bottles";

afterEach(() => {
  vi.useRealTimers();
  bottlesStore.write({ bottles: [] });
});

describe("startNewBottle", () => {
  it("records a new bottle on today's Lima date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-24T02:30:00Z")); // 23 de setiembre, 21:30 en Lima

    startNewBottle("citrato-magnesio-d3");

    expect(bottlesStore.getSnapshot().bottles).toEqual([
      { productId: "citrato-magnesio-d3", startedOn: "2026-09-23" },
    ]);
  });

  it("is idempotent per product and date (UNIQUE user_id, product_id, started_on)", () => {
    startNewBottle("colageno-vitamina-c", "2026-09-01");
    startNewBottle("colageno-vitamina-c", "2026-09-01");

    expect(bottlesStore.getSnapshot().bottles).toHaveLength(1);
  });

  it("does not mutate the previous snapshot", () => {
    const before = bottlesStore.getSnapshot();
    startNewBottle("colageno-vitamina-c", "2026-09-01");
    expect(before.bottles).toEqual([]);
  });
});

describe("currentBottleStart", () => {
  it("returns the most recent start of that product only", () => {
    const state = {
      bottles: [
        { productId: "colageno-vitamina-c", startedOn: "2026-07-01" },
        { productId: "colageno-vitamina-c", startedOn: "2026-09-01" },
        { productId: "citrato-magnesio-d3", startedOn: "2026-10-01" },
      ],
    };
    expect(currentBottleStart(state, "colageno-vitamina-c")).toBe("2026-09-01");
    expect(currentBottleStart(state, "otro-producto")).toBeNull();
  });
});

describe("parseBottlesState", () => {
  it("accepts a valid stored value", () => {
    const raw = { bottles: [{ productId: "colageno-vitamina-c", startedOn: "2026-09-01" }] };
    expect(parseBottlesState(raw)).toEqual(raw);
  });

  it("rejects corrupt data instead of crashing", () => {
    expect(parseBottlesState({ bottles: [{ productId: "", startedOn: "01/09/2026" }] })).toBeNull();
    expect(parseBottlesState("basura")).toBeNull();
  });
});
