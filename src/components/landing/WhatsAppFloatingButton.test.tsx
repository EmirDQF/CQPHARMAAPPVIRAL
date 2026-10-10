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

  it("is disabled with an accessible notice when no number is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_NUMBER", "");
    render(<WhatsAppFloatingButton />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "WhatsApp no disponible por el momento" })
    ).toBeDisabled();
  });

  it("stays hidden inside the app", () => {
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_NUMBER", "51987654321");
    pathname.current = "/app/dashboard";
    const { container } = render(<WhatsAppFloatingButton />);
    expect(container).toBeEmptyDOMElement();
  });
});
