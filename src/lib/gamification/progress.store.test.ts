/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from "vitest";
import { findActivity } from "../activities/catalog";
import {
  EMPTY_GAME_PROGRESS,
  completeActivity,
  gameProgressStore,
  markOpened,
  toggleAccessory,
  undoActivity,
} from "./progress";

const TODAY = "2026-10-11";

afterEach(() => gameProgressStore.write(EMPTY_GAME_PROGRESS));

describe("game progress store", () => {
  it("saves a completed activity once and lets the person undo it", () => {
    completeActivity("agua", TODAY);
    completeActivity("agua", TODAY);
    expect(gameProgressStore.getSnapshot().completions[TODAY]).toEqual(["agua"]);
    expect(JSON.parse(window.localStorage.getItem("artikare_game_v1") ?? "{}").completions[TODAY]).toEqual(["agua"]);
    undoActivity("agua", TODAY);
    expect(gameProgressStore.getSnapshot().completions[TODAY]).toEqual([]);
  });

  it("remembers the last opening day without rewriting the same day", () => {
    markOpened(TODAY);
    const snapshot = gameProgressStore.getSnapshot();
    markOpened(TODAY);
    expect(gameProgressStore.getSnapshot()).toBe(snapshot);
    expect(snapshot.lastOpenedOn).toBe(TODAY);
  });

  it("only equips unlocked accessories and can always take them off", () => {
    toggleAccessory("cap", []);
    expect(gameProgressStore.getSnapshot().equipped).toEqual([]);
    toggleAccessory("cap", ["cap"]);
    expect(gameProgressStore.getSnapshot().equipped).toEqual(["cap"]);
    toggleAccessory("cap", []);
    expect(gameProgressStore.getSnapshot().equipped).toEqual([]);
  });

  it("finds activities by id", () => {
    expect(findActivity("agua")?.emoji).toBe("💧");
    expect(findActivity("nope")).toBeUndefined();
  });
});
