/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StepProgress } from "./StepProgress";

describe("StepProgress", () => {
  it("anuncia el paso actual y el total", () => {
    render(<StepProgress current={2} total={5} />);
    expect(screen.getByText("Paso 2 de 5")).toBeInTheDocument();
  });
});
