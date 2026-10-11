// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { SOFT_DELETE_RESTORE_DAYS } from "../clinical/constants";
import { purgeExpiredTrash, trashStore, type TrashedRecord } from "./trash";

const NOW = new Date("2026-10-11T12:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;

function painTrashedDaysAgo(days: number, date: string): TrashedRecord {
  return {
    id: `pain-${date}`,
    kind: "pain",
    deletedAt: new Date(NOW.getTime() - days * DAY_MS).toISOString(),
    record: { date, painLevel: 4, stiffness: "0-15" },
  };
}

afterEach(() => {
  trashStore.write([]);
  vi.restoreAllMocks();
});

describe("purgeExpiredTrash", () => {
  it("drops records deleted more than 30 days ago and keeps the restorable ones", () => {
    const expired = painTrashedDaysAgo(SOFT_DELETE_RESTORE_DAYS + 1, "2026-08-01");
    const recent = painTrashedDaysAgo(5, "2026-09-30");
    trashStore.write([expired, recent]);

    expect(purgeExpiredTrash(NOW)).toBe(1);

    expect(trashStore.getSnapshot()).toEqual([recent]);
    expect(JSON.parse(window.localStorage.getItem("artikare_trash_v1") ?? "[]")).toEqual([recent]);
  });

  it("purges at exactly 30 days, like the database (deleted_at <= now() - 30 days)", () => {
    trashStore.write([painTrashedDaysAgo(SOFT_DELETE_RESTORE_DAYS, "2026-09-11")]);

    expect(purgeExpiredTrash(NOW)).toBe(1);
    expect(trashStore.getSnapshot()).toEqual([]);
  });

  it("does not rewrite storage when nothing expired", () => {
    trashStore.write([painTrashedDaysAgo(1, "2026-10-10")]);
    const write = vi.spyOn(trashStore, "write");

    expect(purgeExpiredTrash(NOW)).toBe(0);
    expect(write).not.toHaveBeenCalled();
  });
});
