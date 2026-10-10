// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { findForbiddenPhrases } from "@/lib/clinical/forbiddenCopy";
import { CONSENT_VERSION } from "@/lib/privacy/consent";
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

  it("declara la transferencia internacional a Supabase en Brasil (sa-east-1)", () => {
    render(<PrivacidadPage />);
    expect(screen.getByText(/Esto es una transferencia internacional/)).toHaveTextContent(/Brasil \(sa-east-1\)/);
  });

  it("cubre finalidad, consentimiento versionado, plazos, canal y ARCO desde Ajustes", () => {
    render(<PrivacidadPage />);
    for (const heading of [/Finalidad/, /Consentimiento/, /Plazos de conservación/, /Tus derechos \(ARCO\)/]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
    expect(screen.getByText(/versión vigente: /)).toHaveTextContent(CONSENT_VERSION);
    expect(screen.getByText(/Canal de contacto/)).toBeInTheDocument();
    expect(screen.getByText(/Mi Panel → Ajustes/)).toBeInTheDocument();
    expect(screen.getByText(/Pendiente de revisión legal: este texto/)).toBeInTheDocument();
  });

  it("no promete cura ni usa culpa (la política sí nombra a CQ Pharma como responsable)", () => {
    const { container } = render(<PrivacidadPage />);
    const categories = ["cura-reversion", "culpa-miedo"] as const;
    expect(findForbiddenPhrases(container.textContent ?? "", { categories })).toEqual([]);
  });
});
