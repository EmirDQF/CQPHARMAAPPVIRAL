import { describe, expect, it, vi } from "vitest";
import { createFakeSupabase } from "@/test/fakeSupabase";
import { createSupabaseAssessmentRepository } from "./assessments";
import type { RepositoryClient } from "./supabaseRows";
import { RepositoryError } from "./types";

const assessment = {
  id: "7c1f2b8e-9a0d-4c1e-8f5a-2b7c9d0e1f23",
  chronologicalAge: 52,
  articularAge: 63,
  riskLevel: "moderado" as const,
};

describe("SupabaseAssessmentRepository", () => {
  it("guarda solo el resumen anónimo: edades y nivel de riesgo, sin respuestas", async () => {
    const fake = createFakeSupabase();

    await createSupabaseAssessmentRepository(fake.client as unknown as RepositoryClient).record(assessment);

    expect(fake.rows("assessments")).toEqual([
      expect.objectContaining({
        id: assessment.id,
        chronological_age: 52,
        articular_age: 63,
        risk_level: "moderado",
        answers: {},
      }),
    ]);
  });

  it("es idempotente por id: el reintento de la outbox no duplica la evaluación", async () => {
    const fake = createFakeSupabase();
    const repository = createSupabaseAssessmentRepository(fake.client as unknown as RepositoryClient);

    await repository.record(assessment);
    await repository.record(assessment);

    expect(fake.rows("assessments")).toHaveLength(1);
  });

  it("una evaluación inválida falla en vez de perderse en silencio", async () => {
    const fake = createFakeSupabase();
    const repository = createSupabaseAssessmentRepository(fake.client as unknown as RepositoryClient);

    await expect(repository.record({ ...assessment, articularAge: 500 })).rejects.toBeInstanceOf(RepositoryError);
    expect(fake.rows("assessments")).toEqual([]);
  });

  it("un fallo de la base es un RepositoryError", async () => {
    const fake = createFakeSupabase();
    vi.spyOn(console, "error").mockImplementation(() => {});
    fake.failNext("upsert");

    const repository = createSupabaseAssessmentRepository(fake.client as unknown as RepositoryClient);

    await expect(repository.record(assessment)).rejects.toBeInstanceOf(RepositoryError);
  });
});
