// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { findForbiddenPhrases } from "@/lib/clinical/forbiddenCopy";
import type { RiskResult } from "@/lib/types";
import { ResultCard } from "./ResultCard";

vi.mock("@/lib/native/doseNotifications", () => ({ isNativeApp: () => false }));

function result(overrides: Partial<RiskResult> = {}): RiskResult {
  return {
    chronologicalAge: 62,
    articularAge: 70,
    riskScore: 9,
    riskLevel: "alto",
    label: "RIESGO ALTO",
    emoji: "🟥",
    message: "Mensaje de prueba.",
    diagnosticSuggestion: "Densitometría Ósea",
    supplementProtocol: "Protocolo de prueba",
    ...overrides,
  };
}

function isBefore(first: Element, second: Element): boolean {
  return Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
}

describe("ResultCard", () => {
  it("with high risk puts the rheumatology CTA above the study, the supplement and every product CTA", () => {
    render(<ResultCard result={result()} onRestart={() => undefined} />);

    const rheumatology = screen.getByRole("link", { name: "Agendar evaluación reumatológica" });
    expect(isBefore(rheumatology, screen.getByText("Suplementación que puede acompañar tu cuidado"))).toBe(true);
    expect(isBefore(rheumatology, screen.getByText("Estudio recomendado"))).toBe(true);
    expect(isBefore(rheumatology, screen.getByText(/Pedir mi Pack/))).toBe(true);
  });

  it("does not offer the rheumatology CTA for low risk, and always keeps the disclaimer", () => {
    render(<ResultCard result={result({ riskLevel: "bajo", label: "RIESGO BAJO" })} onRestart={() => undefined} />);

    expect(screen.queryByRole("link", { name: "Agendar evaluación reumatológica" })).not.toBeInTheDocument();
    expect(screen.getByText(/Este test es orientativo y no reemplaza un diagnóstico médico/)).toBeInTheDocument();
    expect(screen.getByText("Consulta con tu médico antes de empezar.")).toBeInTheDocument();
  });

  it("keeps the card copy free of cure promises, fear and guilt", () => {
    const { container } = render(<ResultCard result={result()} onRestart={() => undefined} />);
    expect(
      findForbiddenPhrases(container.textContent ?? "", { categories: ["cura-reversion", "culpa-miedo"] })
    ).toEqual([]);
  });
});
