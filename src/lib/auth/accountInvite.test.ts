import { describe, expect, it } from "vitest";
import {
  ACCOUNT_INVITE_COPY,
  ACCOUNT_INVITE_SNOOZE_DAYS,
  ACCOUNT_INVITE_STREAK_DAYS,
  shouldShowAccountInvite,
  type AccountInviteInput,
} from "./accountInvite";

const NOW = new Date("2026-09-25T15:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;

function input(overrides: Partial<AccountInviteInput> = {}): AccountInviteInput {
  return {
    moment: "reporte",
    authStatus: "guest",
    streakDays: 0,
    dismissedAt: null,
    isSyncAvailable: true,
    now: NOW,
    ...overrides,
  };
}

describe("shouldShowAccountInvite", () => {
  it("shows on the medical report and after booking for guests", () => {
    expect(shouldShowAccountInvite(input({ moment: "reporte" }))).toBe(true);
    expect(shouldShowAccountInvite(input({ moment: "cita" }))).toBe(true);
  });

  it("shows on the streak moment only from 3 days of streak", () => {
    expect(ACCOUNT_INVITE_STREAK_DAYS).toBe(3);
    expect(shouldShowAccountInvite(input({ moment: "racha", streakDays: 2 }))).toBe(false);
    expect(shouldShowAccountInvite(input({ moment: "racha", streakDays: 3 }))).toBe(true);
  });

  it("also invites anonymous sessions, which still lose data when changing phones", () => {
    expect(shouldShowAccountInvite(input({ authStatus: "anonymous" }))).toBe(true);
  });

  it.each(["account", "loading", "unconfigured"] as const)(
    "never shows when auth status is %s",
    (authStatus) => {
      expect(shouldShowAccountInvite(input({ authStatus }))).toBe(false);
    }
  );

  it("respects 'Ahora no' for the snooze period, then invites again", () => {
    const justDismissed = new Date(NOW.getTime() - DAY_MS).toISOString();
    const snoozeOver = new Date(NOW.getTime() - ACCOUNT_INVITE_SNOOZE_DAYS * DAY_MS).toISOString();

    expect(shouldShowAccountInvite(input({ dismissedAt: justDismissed }))).toBe(false);
    expect(shouldShowAccountInvite(input({ dismissedAt: snoozeOver }))).toBe(true);
  });

  it("never promises a backup before server sync exists (C3)", () => {
    expect(shouldShowAccountInvite(input({ isSyncAvailable: false }))).toBe(false);
  });

  it("treats a corrupt dismissal date as not dismissed", () => {
    expect(shouldShowAccountInvite(input({ dismissedAt: "no-es-fecha" }))).toBe(true);
  });
});

describe("ACCOUNT_INVITE_COPY", () => {
  it("uses the approved message with 'Ahora no' and no fear or guilt", () => {
    expect(ACCOUNT_INVITE_COPY.title).toBe("No pierdas tus registros si cambias de celular");
    expect(ACCOUNT_INVITE_COPY.dismiss).toBe("Ahora no");
    const allCopy = Object.values(ACCOUNT_INVITE_COPY).join(" ");
    expect(allCopy).not.toMatch(/perder[aá]s todo|peligro|riesgo|urgente|culpa|última oportunidad/i);
  });
});
