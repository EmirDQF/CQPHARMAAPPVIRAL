/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DailyReinforcementBanner } from "./DailyReinforcementBanner";

const playSound = vi.fn();
vi.mock("@/lib/feedback/sounds", () => ({ playSound: (name: string) => playSound(name) }));
vi.mock("@/lib/feedback/haptics", () => ({ triggerHaptic: vi.fn(async () => undefined) }));

describe("DailyReinforcementBanner", () => {
  it("shows a daily phrase and swaps it with a tap sound on 'Otra frase'", () => {
    render(<DailyReinforcementBanner />);
    const live = screen.getByText(/cuidar tu movilidad|cuidando tu movilidad/);
    const before = live.textContent;

    fireEvent.click(screen.getByRole("button", { name: /Otra frase/ }));

    expect(screen.getByText(/cuidar tu movilidad|cuidando tu movilidad/).textContent).not.toBe(before);
    expect(playSound).toHaveBeenCalledWith("tap");
  });
});
