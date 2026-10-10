import { describe, expect, it } from "vitest";
import { FORBIDDEN_COPY_PATTERNS, findForbiddenPhrases } from "./forbiddenCopy";

function matchedIds(text: string): string[] {
  return findForbiddenPhrases(text).map((finding) => finding.id);
}

describe("findForbiddenPhrases", () => {
  it.each([
    ["Este pack cura la artrosis.", "cura"],
    ["Ayuda a curar tus rodillas.", "cura"],
    ["Revierte la osteopenia en semanas.", "reversion"],
    ["Puede revertir la osteoporosis.", "reversion"],
    ["Regenera el cartílago.", "regeneracion"],
    ["Para regenerar cartílago.", "regeneracion"],
    ["Repara tus articulaciones.", "reparacion"],
    ["Te ayuda a reparar el hueso.", "reparacion"],
    ["Elimina el dolor desde el primer día.", "elimina-dolor"],
    ["Garantiza resultados.", "garantia"],
    ["El suplemento reemplaza tu tratamiento.", "reemplaza-tratamiento"],
  ])("flags cure or reversal claims: %s", (text, expectedId) => {
    expect(matchedIds(text)).toContain(expectedId);
  });

  it.each([
    ["Con colágeno hidrolizado.", "colageno"],
    ["Citrato de Magnesio.", "magnesio"],
    ["Vitamina C pura.", "vitamina"],
    ["Con D3 y zinc.", "vitamina-d3"],
    ["Con D3 y zinc.", "zinc"],
    ["Respaldado por CQ Pharma.", "marca-cq-pharma"],
    ["Prueba Kolflex.", "marca-kolflex"],
  ])("flags product names and ingredients: %s", (text, expectedId) => {
    expect(matchedIds(text)).toContain(expectedId);
  });

  it.each([
    ["¡No falles hoy!", "no-falles"],
    ["Si no registras, perderás tu avance.", "perderas"],
    ["No rompas tu racha.", "no-rompas"],
  ])("flags guilt or fear copy: %s", (text, expectedId) => {
    expect(matchedIds(text)).toContain(expectedId);
  });

  it("returns the matched text and its category", () => {
    expect(findForbiddenPhrases("Esto CURA todo.")).toEqual([
      { id: "cura", category: "cura-reversion", match: "CURA" },
    ]);
  });

  it.each([
    "Registrar tu día es una forma sencilla de cuidarte.",
    "Procura descansar bien esta noche.",
    "El suplemento apoya y complementa tu tratamiento.",
    "Este test es orientativo y no reemplaza un diagnóstico médico.",
    "Los suplementos nunca reemplazan el tratamiento indicado por tu médico.",
    "Prepara tus preguntas para la consulta.",
    "Tu vitalidad y tu movilidad importan.",
  ])("does not flag neutral or disclaimer copy: %s", (text) => {
    expect(findForbiddenPhrases(text)).toEqual([]);
  });

  it("can be limited to some categories for surfaces that may name products", () => {
    const text = "Pack con Magnesio que cura.";
    expect(findForbiddenPhrases(text, { categories: ["cura-reversion"] })).toEqual([
      { id: "cura", category: "cura-reversion", match: "cura" },
    ]);
  });

  it("uses non-global patterns so repeated calls stay consistent", () => {
    for (const { pattern } of FORBIDDEN_COPY_PATTERNS) {
      expect(pattern.global).toBe(false);
    }
    expect(matchedIds("cura")).toEqual(matchedIds("cura"));
  });
});
