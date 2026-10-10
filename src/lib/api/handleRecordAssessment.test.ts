import { describe, expect, it, vi } from "vitest";
import type { AssessmentRepository } from "@/lib/repositories/assessments";
import { RepositoryError } from "@/lib/repositories/types";
import { handleRecordAssessment } from "./handleRecordAssessment";

const requester = { id: "00000000-0000-4000-8000-00000000a11c", isAnonymous: true };
const body = {
  id: "7c1f2b8e-9a0d-4c1e-8f5a-2b7c9d0e1f23",
  chronologicalAge: 52,
  articularAge: 63,
  riskLevel: "moderado",
};

function repositoryWith(record: AssessmentRepository["record"]): AssessmentRepository {
  return { record: vi.fn(record) };
}

describe("handleRecordAssessment", () => {
  it("con sesión guarda el resumen y responde 201", async () => {
    const repository = repositoryWith(async () => {});

    await expect(handleRecordAssessment({ repository, requester, body })).resolves.toEqual({
      status: 201,
      data: { id: body.id },
    });
    expect(repository.record).toHaveBeenCalledWith(body);
  });

  it("sin sesión responde 401", async () => {
    const repository = repositoryWith(async () => {});

    await expect(handleRecordAssessment({ repository, requester: null, body })).resolves.toMatchObject({
      status: 401,
    });
    expect(repository.record).not.toHaveBeenCalled();
  });

  it("rechaza respuestas del cuestionario: solo viaja el resumen anónimo", async () => {
    const repository = repositoryWith(async () => {});

    const result = await handleRecordAssessment({
      repository,
      requester,
      body: { ...body, answers: { rigidez: "si" } },
    });

    expect(result.status).toBe(400);
  });

  it("un id que no es uuid responde 400", async () => {
    const repository = repositoryWith(async () => {});

    await expect(
      handleRecordAssessment({ repository, requester, body: { ...body, id: "evaluacion-1" } })
    ).resolves.toMatchObject({ status: 400 });
  });

  it("un fallo de la base responde 503", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const repository = repositoryWith(async () => {
      throw new RepositoryError("guardar assessments");
    });

    await expect(handleRecordAssessment({ repository, requester, body })).resolves.toMatchObject({ status: 503 });
  });
});
