// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WhatsAppFloatingButton } from "./WhatsAppFloatingButton";

const pathname = vi.hoisted(() => ({ current: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

afterEach(() => {
  vi.unstubAllEnvs();
  pathname.current = "/";
});

describe("WhatsAppFloatingButton", () => {
  it("links to the configured WhatsApp number", () => {
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_NUMBER", "51987654321");
    render(<WhatsAppFloatingButton />);
    expect(
      screen.getByRole("link", { name: "Habla con un asesor médico sobre tus articulaciones" })
    ).toHaveAttribute("href", expect.stringMatching(/^https:\/\/wa\.me\/51987654321\?text=/));
  });

  it("renders nothing (no dead button) when no number is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_NUMBER", "");
    const { container } = render(<WhatsAppFloatingButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it("stays hidden inside the app", () => {
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_NUMBER", "51987654321");
    pathname.current = "/app/dashboard";
    const { container } = render(<WhatsAppFloatingButton />);
    expect(container).toBeEmptyDOMElement();
  });
});
