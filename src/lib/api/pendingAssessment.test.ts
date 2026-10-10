// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { outboxStore } from "./outbox";
import {
  pendingAssessmentStore,
  savePendingAssessment,
  uploadPendingAssessment,
} from "./pendingAssessment";

const result = { chronologicalAge: 52, articularAge: 63, riskLevel: "moderado" as const };

beforeEach(() => {
  // Sin red: la outbox conserva lo encolado para inspeccionarlo.
  vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);
  outboxStore.write([]);
  pendingAssessmentStore.write({ assessment: null });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("evaluación pendiente (C4)", () => {
  it("al terminar el test guarda solo el resumen, con un id para no duplicarlo", () => {
    savePendingAssessment(result);

    expect(pendingAssessmentStore.getSnapshot().assessment).toEqual({
      ...result,
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
    });
  });

  it("un test nuevo reemplaza al anterior: solo se sube el último", () => {
    savePendingAssessment(result);
    savePendingAssessment({ ...result, articularAge: 70 });

    expect(pendingAssessmentStore.getSnapshot().assessment?.articularAge).toBe(70);
  });

  it("con sesión se encola en /api/assessments, sin datos personales, y deja de estar pendiente", () => {
    savePendingAssessment(result);
    const { assessment } = pendingAssessmentStore.getSnapshot();

    expect(uploadPendingAssessment()).toBe(true);

    expect(outboxStore.getSnapshot()).toEqual([
      expect.objectContaining({ endpoint: "/api/assessments", containsPersonalData: false, body: assessment }),
    ]);
    expect(pendingAssessmentStore.getSnapshot().assessment).toBeNull();
  });

  it("sin evaluación pendiente no encola nada", () => {
    expect(uploadPendingAssessment()).toBe(false);
    expect(outboxStore.getSnapshot()).toEqual([]);
  });
});
