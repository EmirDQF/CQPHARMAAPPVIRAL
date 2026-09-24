// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createPersistentStore } from "./persistentStore";

const KEY = "artikare_test_store_v1";

function parseCount(raw: unknown): { count: number } | null {
  if (typeof raw !== "object" || raw === null || !("count" in raw)) return null;
  return typeof raw.count === "number" ? { count: raw.count } : null;
}

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("createPersistentStore with a parser", () => {
  it("returns the parsed value", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ count: 3, legacy: true }));
    const store = createPersistentStore(KEY, { count: 0 }, parseCount);
    expect(store.getSnapshot()).toEqual({ count: 3 });
  });

  it("falls back to the empty value, logs, and does not overwrite invalid data", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    window.localStorage.setItem(KEY, JSON.stringify({ count: "tres" }));
    const store = createPersistentStore(KEY, { count: 0 }, parseCount);

    expect(store.getSnapshot()).toEqual({ count: 0 });
    expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify({ count: "tres" }));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining(KEY));
  });
});
