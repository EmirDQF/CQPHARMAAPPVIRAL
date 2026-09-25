// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PrivacidadPage from "./page";

describe("/privacidad", () => {
  it("explica la prueba seudonimizada del consentimiento y la marca como pendiente de revisión legal", () => {
    render(<PrivacidadPage />);
    const proof = screen.getByText(/prueba seudonimizada/i);
    expect(proof).toHaveTextContent(/sin tu nombre, correo, teléfono ni datos de salud/i);
    expect(proof).toHaveTextContent("Pendiente de revisión legal (Ley 29733)");
  });

  it("explica que un registro borrado se puede deshacer durante 30 días", () => {
    render(<PrivacidadPage />);
    expect(screen.getByText(/deshacerlo durante 30 días/)).toBeInTheDocument();
  });
});
