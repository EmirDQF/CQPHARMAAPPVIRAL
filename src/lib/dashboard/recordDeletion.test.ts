// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { SOFT_DELETE_RESTORE_DAYS } from "../clinical/constants";
import { selectRestorableRecords, trashStore } from "../storage/trash";
import { addDexaScanEntry, dexaVaultStore } from "./dexaVault";
import { painLogStore } from "./painLog";
import { restoreTrashedRecord, softDeleteDexaScan, softDeletePainLog } from "./recordDeletion";

const DELETED_AT = new Date("2026-09-10T15:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;

function daysAfterDeletion(days: number): Date {
  return new Date(DELETED_AT.getTime() + days * DAY_MS);
}

const scan = {
  id: "dexa-1",
  date: "2026-08-01",
  lumbarTScore: -2.6,
  femoralNeckTScore: -1.9,
  radiologyCenter: "",
};

afterEach(() => {
  dexaVaultStore.write([]);
  painLogStore.write([]);
  trashStore.write([]);
});

describe("softDeleteDexaScan", () => {
  it("hides the scan from the vault and keeps it in the trash", () => {
    dexaVaultStore.write([scan]);
    expect(softDeleteDexaScan("dexa-1", DELETED_AT)).toBe(true);

    expect(dexaVaultStore.getSnapshot()).toEqual([]);
    const [trashed] = selectRestorableRecords(trashStore.getSnapshot(), DELETED_AT);
    expect(trashed).toMatchObject({ kind: "dexa", record: scan, deletedAt: DELETED_AT.toISOString() });
  });

  it("returns false for an unknown scan and changes nothing", () => {
    dexaVaultStore.write([scan]);
    expect(softDeleteDexaScan("dexa-x", DELETED_AT)).toBe(false);
    expect(dexaVaultStore.getSnapshot()).toEqual([scan]);
    expect(trashStore.getSnapshot()).toEqual([]);
  });
});

describe("softDeletePainLog", () => {
  it("moves the day to the trash, including a day with pain 0", () => {
    painLogStore.write([{ date: "2026-09-09", painLevel: 0, stiffness: "0-15" }]);
    expect(softDeletePainLog("2026-09-09", DELETED_AT)).toBe(true);
    expect(painLogStore.getSnapshot()).toEqual([]);
    expect(trashStore.getSnapshot()).toHaveLength(1);
  });
});

describe("restoreTrashedRecord", () => {
  it(`restores within ${SOFT_DELETE_RESTORE_DAYS} days`, () => {
    dexaVaultStore.write([scan]);
    softDeleteDexaScan("dexa-1", DELETED_AT);
    const [trashed] = trashStore.getSnapshot();

    expect(restoreTrashedRecord(trashed.id, daysAfterDeletion(SOFT_DELETE_RESTORE_DAYS - 1))).toBe(
      "restored"
    );
    expect(dexaVaultStore.getSnapshot()).toEqual([scan]);
    expect(trashStore.getSnapshot()).toEqual([]);
  });

  it(`refuses after ${SOFT_DELETE_RESTORE_DAYS} days and drops the expired item`, () => {
    painLogStore.write([{ date: "2026-09-09", painLevel: 5, stiffness: "0-15" }]);
    softDeletePainLog("2026-09-09", DELETED_AT);
    const [trashed] = trashStore.getSnapshot();
    const expiredAt = daysAfterDeletion(SOFT_DELETE_RESTORE_DAYS + 1);

    expect(selectRestorableRecords(trashStore.getSnapshot(), expiredAt)).toEqual([]);
    expect(restoreTrashedRecord(trashed.id, expiredAt)).toBe("expired");
    expect(painLogStore.getSnapshot()).toEqual([]);
    expect(trashStore.getSnapshot()).toEqual([]);
  });

  it("returns not-found for an unknown id", () => {
    expect(restoreTrashedRecord("nope", DELETED_AT)).toBe("not-found");
  });

  it("a new record for the same date replaces the deleted one (same rule as the database)", () => {
    dexaVaultStore.write([scan]);
    softDeleteDexaScan("dexa-1", DELETED_AT);
    addDexaScanEntry({ date: scan.date, lumbarTScore: -1.0, femoralNeckTScore: -1.1, radiologyCenter: "" });

    expect(trashStore.getSnapshot()).toEqual([]);
    expect(dexaVaultStore.getSnapshot()).toHaveLength(1);
  });

  it("never duplicates a date when restoring over an active record", () => {
    painLogStore.write([{ date: "2026-09-09", painLevel: 5, stiffness: "0-15" }]);
    softDeletePainLog("2026-09-09", DELETED_AT);
    const [trashed] = trashStore.getSnapshot();
    // Escritura directa que se salta la purga (p. ej. datos de otra pestaña).
    painLogStore.write([{ date: "2026-09-09", painLevel: 2, stiffness: "0-15" }]);

    expect(restoreTrashedRecord(trashed.id, DELETED_AT)).toBe("conflict");
    expect(painLogStore.getSnapshot()).toEqual([{ date: "2026-09-09", painLevel: 2, stiffness: "0-15" }]);
  });
});
