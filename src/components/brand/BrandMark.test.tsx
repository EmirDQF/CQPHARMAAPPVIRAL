// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandMark } from "./BrandMark";

describe("BrandMark", () => {
  it("expone solo el nombre de la marca a lectores de pantalla", () => {
    const { container } = render(<BrandMark />);

    expect(screen.getByText("Artikare")).toBeInTheDocument();
    expect(container.querySelector("svg")?.closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("combina clases adicionales sin perder el color clínico", () => {
    render(<BrandMark className="text-base" />);

    expect(screen.getByText("Artikare")).toHaveClass("text-base", "text-clinic");
  });
});
