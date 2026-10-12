/** @vitest-environment jsdom */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GameState } from "@/hooks/useGame";
import { EMPTY_GAME_PROGRESS, gameProgressStore } from "@/lib/gamification/progress";
import { ShareCorner } from "./ShareCorner";

const nativeShare = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock("@/lib/share/browserShare", () => ({
  browserShareDependencies: () => ({ isNativeApp: () => true, nativeShare, openUrl: vi.fn() }),
}));
vi.mock("@/lib/feedback/haptics", () => ({ triggerHaptic: vi.fn(async () => undefined) }));

const TODAY = "2026-10-11";

function game(overrides: { streakDays?: number; weekDone?: boolean } = {}): GameState {
  const { streakDays = 4, weekDone = false } = overrides;
  return {
    today: TODAY,
    stats: {
      streak: { days: streakDays, shields: 0, todayComplete: false, shieldUsedOn: null },
      week: { weekStart: "2026-10-05", activeDays: weekDone ? 7 : 2, target: 7, done: weekDone, activeByWeekday: [true, true, false, false, false, false, false] },
    },
  } as unknown as GameState;
}

afterEach(() => gameProgressStore.write(EMPTY_GAME_PROGRESS));

describe("ShareCorner", () => {
  it("shows a preview with brand and disclaimer and lets the person say 'Ahora no'", () => {
    render(<ShareCorner game={game()} />);
    fireEvent.click(screen.getByRole("button", { name: /Compartir mi racha de 4 días/ }));
    const sheet = screen.getByRole("dialog", { name: "Compartir con Artiko" });
    expect(within(sheet).getByRole("figure", { name: "Vista previa de la tarjeta" })).toHaveTextContent("¡Mi racha de 4 días!");
    expect(within(sheet).getByText(/no reemplaza la consulta con tu médico/)).toBeInTheDocument();
    fireEvent.click(within(sheet).getByRole("button", { name: "Ahora no" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(nativeShare).not.toHaveBeenCalled();
  });

  it("invites a parent and rewards it only with the cosmetic family badge path", async () => {
    render(<ShareCorner game={game({ streakDays: 0 })} />);
    expect(screen.queryByRole("button", { name: /Compartir mi racha/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Invita a tu mamá o papá/ }));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Compartir 📤/ })));
    expect(nativeShare).toHaveBeenCalledWith(expect.objectContaining({ url: expect.stringContaining("utm_campaign=derivacion-familiar") }));
    expect(screen.getByRole("status")).toHaveTextContent("¡Gracias por compartir!");
    expect(gameProgressStore.getSnapshot().completions[TODAY]).toEqual(["anima-familia"]);
  });

  it("offers the 'Semana constante' badge once the week is complete", () => {
    render(<ShareCorner game={game({ weekDone: true })} />);
    expect(screen.getByText(/7 de 7 días activos/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Compartir mi insignia/ }));
    expect(screen.getByRole("figure", { name: "Vista previa de la tarjeta" })).toHaveTextContent("Semana constante");
  });
});
