// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AboutSection } from "./AboutSection";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("AboutSection", () => {
  it("muestra la versión y el build inyectados en el build", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_VERSION", "0.2.0");
    vi.stubEnv("NEXT_PUBLIC_APP_BUILD", "200");

    render(<AboutSection />);

    const section = screen.getByRole("region", { name: "Acerca de" });
    expect(section).toHaveTextContent("Artikare v0.2.0 (build 200)");
  });

  it("sin versión inyectada no inventa números", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_VERSION", "");
    vi.stubEnv("NEXT_PUBLIC_APP_BUILD", "");

    render(<AboutSection />);

    expect(screen.getByRole("region", { name: "Acerca de" })).toHaveTextContent("Artikare (versión de desarrollo)");
  });
});
