/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ARTIKO_EMOTIONS, artikoLabel } from "@/lib/mascot/mascot";
import { ArtikoFigure } from "./ArtikoFigure";
import { ArtikoMascot } from "./ArtikoMascot";

describe("ArtikoFigure", () => {
  it.each(ARTIKO_EMOTIONS)("draws the %s state as an accessible image", (emotion) => {
    const { container } = render(<ArtikoFigure emotion={emotion} />);
    const image = screen.getByRole("img", { name: artikoLabel(emotion) });
    expect(image.tagName.toLowerCase()).toBe("svg");
    expect(image).toHaveAttribute("data-emotion", emotion);
    expect(container.querySelector("image, img, use[href^='http']")).toBeNull();
  });

  it("hides itself from screen readers when decorative", () => {
    const { container } = render(<ArtikoFigure decorative />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("wears the unlocked cosmetic accessories", () => {
    const { container } = render(<ArtikoFigure accessories={["cap", "scarf", "glasses"]} />);
    ["cap", "scarf", "glasses"].forEach((item) =>
      expect(container.querySelector(`[data-accessory="${item}"]`)).not.toBeNull()
    );
  });

  it("keeps the 120:140 proportion at 32 px", () => {
    const { container } = render(<ArtikoFigure size={32} decorative />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("height", "32");
    expect(Number(svg?.getAttribute("width"))).toBeCloseTo((32 * 120) / 140);
  });

  it("uses only design tokens, never loose hex colors", () => {
    const { container } = render(<ArtikoFigure emotion="fire_streak" accessories={["cap", "scarf", "glasses"]} />);
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,6}\b/i);
  });
});

describe("ArtikoMascot", () => {
  it("renders the same accessible figure inside the animated wrapper", () => {
    render(<ArtikoMascot emotion="celebrating" />);
    expect(screen.getByRole("img", { name: artikoLabel("celebrating") })).toBeInTheDocument();
  });
});
