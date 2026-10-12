/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GameButton } from "./GameButton";

const triggerHaptic = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock("@/lib/feedback/haptics", () => ({ triggerHaptic }));

describe("GameButton", () => {
  it("runs the action and a light vibration on tap", () => {
    const onClick = vi.fn();
    render(<GameButton onClick={onClick}>¡Vamos!</GameButton>);
    fireEvent.click(screen.getByRole("button", { name: "¡Vamos!" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(triggerHaptic).toHaveBeenCalledWith("light");
  });

  it("blocks the action when aria-disabled and keeps it focusable", () => {
    const onClick = vi.fn();
    render(
      <GameButton aria-disabled="true" aria-describedby="why" onClick={onClick}>
        Guardar
      </GameButton>
    );
    const button = screen.getByRole("button", { name: "Guardar" });
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(button).not.toBeDisabled();
  });

  it("is a non-submit 48px+ pressable button by default", () => {
    render(<GameButton size="md">Listo</GameButton>);
    const button = screen.getByRole("button", { name: "Listo" });
    expect(button).toHaveAttribute("type", "button");
    expect(button.className).toMatch(/min-h-12/);
    expect(button.className).toMatch(/pressable-3d/);
  });
});
