// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { BoneScanSummary } from "@/lib/dashboard/types";
import { BoneSemaphoreWidget } from "./BoneSemaphoreWidget";

const BASE = {
  scanDate: "2025-08-15",
  worstTScore: -2.8,
  diagnosisMessage: "Mensaje de prueba",
  nextControlMonths: 12,
} as const;

const Z_SCORE_SCAN: BoneScanSummary = {
  ...BASE,
  diagnosisLabel: "Consulte a su médico (Z-score)",
  interpretation: "z-score-required",
  riskLevel: null,
  profileNote: null,
};

const OSTEOPOROSIS_SCAN: BoneScanSummary = {
  ...BASE,
  worstTScore: -2.5,
  diagnosisLabel: "Osteoporosis",
  interpretation: "t-score",
  riskLevel: "alto",
  profileNote: null,
};

describe("BoneSemaphoreWidget", () => {
  it("con perfil Z-score pone la derivación médica como dato principal, no el número", () => {
    render(<BoneSemaphoreWidget scan={Z_SCORE_SCAN} onUploadClick={vi.fn()} />);

    const region = screen.getByRole("region", { name: "Consulte a su médico (Z-score)" });
    expect(region).toBeInTheDocument();
    expect(screen.queryByText("Peor T-Score (lumbar / cuello femoral)")).not.toBeInTheDocument();
    expect(screen.getByText(/en tu perfil no se interpreta con el semáforo OMS/)).toBeInTheDocument();
  });

  it("con semáforo OMS muestra el peor T-score como dato principal y la CTA reumatológica en rojo", () => {
    render(<BoneSemaphoreWidget scan={OSTEOPOROSIS_SCAN} onUploadClick={vi.fn()} />);

    expect(screen.getByRole("region", { name: "-2.5" })).toBeInTheDocument();
    expect(screen.getByText("Osteoporosis")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Agendar evaluación reumatológica" })).toBeInTheDocument();
  });

  it("muestra el año del estudio para no confundir uno antiguo con uno reciente", () => {
    render(<BoneSemaphoreWidget scan={OSTEOPOROSIS_SCAN} onUploadClick={vi.fn()} />);

    expect(screen.getByText(/Tu última densitometría: 15 de agosto de 2025/)).toBeInTheDocument();
  });

  it("sin densitometría no inventa un T-score", () => {
    render(<BoneSemaphoreWidget scan={null} onUploadClick={vi.fn()} />);

    expect(screen.getByText("Sin densitometría registrada")).toBeInTheDocument();
    expect(screen.queryByText(/-\d\.\d/)).not.toBeInTheDocument();
  });
});
