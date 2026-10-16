import { describe, expect, it } from "vitest";
import { findForbiddenPhrases } from "../clinical/forbiddenCopy";
import { ALARM_SIGNS, GLOSSARY, searchGlossary } from "./glossary";
import { LESSONS, visibleLessons } from "./lessons";
import { CONTENT_SOURCES, LEARN_DISCLAIMER, lessonCatalogSchema } from "./schemas";

const lessonText = LESSONS.map((lesson) => ({
  id: lesson.id,
  text: [lesson.title, lesson.summary, lesson.keyPoint, ...lesson.body, ...lesson.doctorQuestions].join(" "),
}));

describe("Aprender: catálogo de fichas", () => {
  it("has at least 20 lessons of 1–2 minutes, each with three doctor questions", () => {
    expect(LESSONS.length).toBeGreaterThanOrEqual(20);
    for (const lesson of LESSONS) {
      expect(lesson.minutes).toBeLessThanOrEqual(2);
      expect(lesson.doctorQuestions).toHaveLength(3);
    }
  });

  it("every item carries a general source and is pending medical validation", () => {
    for (const item of [...LESSONS, ...GLOSSARY, ...ALARM_SIGNS]) {
      expect(CONTENT_SOURCES).toContain(item.source);
      expect(item.reviewStatus).toBe("pendiente");
    }
  });

  it.each(lessonText)("$id makes no cure claims, doses or treatment changes", ({ text }) => {
    expect(findForbiddenPhrases(text, { categories: ["cura-reversion", "culpa-miedo"] })).toEqual([]);
    expect(text).not.toMatch(/\d+\s*(mg|UI|µg|mcg|gramos)\b/i);
    expect(text).not.toMatch(/lubrica|reduce la rigidez|desinflama/i);
  });

  it("uses the exact WHO thresholds when it explains the T-score", () => {
    const tScore = LESSONS.find((lesson) => lesson.id === "como-leer-el-t-score");
    expect(tScore?.body.join(" ")).toMatch(/-1\.0 o más es normal/);
    expect(tScore?.body.join(" ")).toMatch(/-2\.5 o menos corresponde a osteoporosis/);
  });

  it("rejects a duplicated id at load time", () => {
    const duplicated = [...LESSONS, LESSONS[0]];
    expect(lessonCatalogSchema.safeParse(duplicated).success).toBe(false);
  });

  it("hides the lessons that suggest physical movement while a red flag is active", () => {
    const physical = LESSONS.filter((lesson) => lesson.physical);
    expect(physical.length).toBeGreaterThan(0);
    expect(visibleLessons(true).some((lesson) => lesson.physical)).toBe(false);
    expect(visibleLessons(false)).toHaveLength(LESSONS.length);
  });

  it("the disclaimer asks to see a doctor", () => {
    expect(LEARN_DISCLAIMER).toMatch(/Consulta a tu médico/);
  });
});

describe("glosario y señales de alarma", () => {
  it("finds terms without accents or capitals", () => {
    expect(searchGlossary("densitometria").map((item) => item.term)).toContain("Densitometría ósea");
    expect(searchGlossary("ACIDO").map((item) => item.term)).toContain("Ácido úrico");
  });

  it("returns everything for an empty query and nothing for nonsense", () => {
    expect(searchGlossary("  ")).toHaveLength(GLOSSARY.length);
    expect(searchGlossary("zzzz")).toEqual([]);
  });

  it("lists the classic reasons to see a rheumatologist", () => {
    const ids = ALARM_SIGNS.map((item) => item.id);
    expect(ids).toEqual(
      expect.arrayContaining(["articulacion-caliente", "rigidez-prolongada", "dolor-nocturno", "perdida-de-estatura", "fractura-golpe-leve"])
    );
  });
});
