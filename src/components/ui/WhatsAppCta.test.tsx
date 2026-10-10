// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WhatsAppCta } from "./WhatsAppCta";

describe("WhatsAppCta", () => {
  it("renders an external link when WhatsApp is configured", () => {
    render(
      <WhatsAppCta href="https://wa.me/51987654321?text=Hola" className="cta">
        Reservar por WhatsApp
      </WhatsAppCta>
    );
    const link = screen.getByRole("link", { name: "Reservar por WhatsApp" });
    expect(link).toHaveAttribute("href", "https://wa.me/51987654321?text=Hola");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders a disabled button with an accessible notice when WhatsApp is unavailable", () => {
    render(
      <WhatsAppCta href={null} className="cta">
        Reservar por WhatsApp
      </WhatsAppCta>
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    const button = screen.getByRole("button", { name: "Reservar por WhatsApp" });
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleDescription("WhatsApp no disponible por el momento");
    expect(screen.getByText("WhatsApp no disponible por el momento")).toBeVisible();
  });
});
