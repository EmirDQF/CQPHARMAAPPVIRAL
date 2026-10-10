// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { outboxStore } from "@/lib/api/outbox";
import { pendingAssessmentStore, savePendingAssessment } from "@/lib/api/pendingAssessment";
import { PendingAssessmentUploader } from "./PendingAssessmentUploader";

vi.mock("@/hooks/useAuthStatus", () => ({ useAuthStatus: vi.fn(() => "anonymous") }));

beforeEach(() => {
  // Sin red: la outbox conserva lo encolado para inspeccionarlo.
  vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);
  outboxStore.write([]);
  pendingAssessmentStore.write({ assessment: null });
  savePendingAssessment({ chronologicalAge: 52, articularAge: 63, riskLevel: "moderado" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PendingAssessmentUploader", () => {
  it.each(["anonymous", "account"] as const)("con sesión (%s) sube la evaluación pendiente", (status) => {
    vi.mocked(useAuthStatus).mockReturnValue(status);

    render(<PendingAssessmentUploader />);

    expect(outboxStore.getSnapshot()).toEqual([expect.objectContaining({ endpoint: "/api/assessments" })]);
    expect(pendingAssessmentStore.getSnapshot().assessment).toBeNull();
  });

  it.each(["guest", "unconfigured", "loading"] as const)("sin sesión (%s) la deja pendiente", (status) => {
    vi.mocked(useAuthStatus).mockReturnValue(status);

    render(<PendingAssessmentUploader />);

    expect(outboxStore.getSnapshot()).toEqual([]);
    expect(pendingAssessmentStore.getSnapshot().assessment).not.toBeNull();
  });
});
