/**
 * Copy prohibido por las "Reglas clínicas vigentes" (CLAUDE.md) más las
 * restricciones de tono de los mensajes de refuerzo. Pensado para tests de
 * cualquier superficie: `expect(findForbiddenPhrases(texto)).toEqual([])`.
 */

export type ForbiddenCopyCategory = "cura-reversion" | "producto-ingrediente" | "culpa-miedo";

export interface ForbiddenCopyPattern {
  id: string;
  category: ForbiddenCopyCategory;
  pattern: RegExp;
}

export interface ForbiddenPhraseFinding {
  id: string;
  category: ForbiddenCopyCategory;
  match: string;
}

export interface FindForbiddenPhrasesOptions {
  /** Solo revisa estas categorías (p. ej. una ficha de producto sí nombra ingredientes). */
  categories?: readonly ForbiddenCopyCategory[];
}

// `\b` de JS solo entiende ASCII: con tildes ("curará", "colágeno") fallaría.
const NOT_LETTER_BEFORE = "(?<![\\p{L}\\p{N}])";
const NOT_LETTER_AFTER = "(?![\\p{L}\\p{N}])";
// Los descargos legales ("no reemplaza un diagnóstico") están permitidos.
const NOT_NEGATED = "(?<!(?:^|[^\\p{L}])(?:no|nunca)\\s+)";

function wholeWords(source: string, prefix = ""): RegExp {
  return new RegExp(`${prefix}${NOT_LETTER_BEFORE}(?:${source})${NOT_LETTER_AFTER}`, "iu");
}

function rule(id: string, category: ForbiddenCopyCategory, pattern: RegExp): ForbiddenCopyPattern {
  return { id, category, pattern };
}

export const FORBIDDEN_COPY_PATTERNS: readonly ForbiddenCopyPattern[] = [
  rule("cura", "cura-reversion", wholeWords("cura(?:n|r|rá|rán|ción|tiv[oa]s?)?")),
  rule("reversion", "cura-reversion", wholeWords("revi[eé]rt\\p{L}*|revert\\p{L}*|reversi[oó]n")),
  rule("regeneracion", "cura-reversion", wholeWords("regener\\p{L}*")),
  rule("reparacion", "cura-reversion", wholeWords("repar(?:a|an|ar|ará|arán|ación|ador[a]?)")),
  rule("elimina-dolor", "cura-reversion", wholeWords("elimina(?:r|rá|n)?\\s+(?:el|tu|su)\\s+dolor")),
  rule("garantia", "cura-reversion", wholeWords("garantiz\\p{L}*")),
  rule("reemplaza-tratamiento", "cura-reversion", wholeWords("reemplaz\\p{L}*", NOT_NEGATED)),
  rule("colageno", "producto-ingrediente", wholeWords("col[aá]geno")),
  rule("magnesio", "producto-ingrediente", wholeWords("magnesio")),
  rule("vitamina", "producto-ingrediente", wholeWords("vitaminas?")),
  rule("vitamina-d3", "producto-ingrediente", wholeWords("d3")),
  rule("zinc", "producto-ingrediente", wholeWords("zinc")),
  rule("marca-cq-pharma", "producto-ingrediente", wholeWords("cq\\s*pharma")),
  rule("marca-kolflex", "producto-ingrediente", wholeWords("kolflex")),
  rule("no-falles", "culpa-miedo", wholeWords("no\\s+falles")),
  rule("perderas", "culpa-miedo", wholeWords("perder(?:ás|á|án)|perder\\s+tu\\s+racha")),
  rule("no-rompas", "culpa-miedo", wholeWords("no\\s+rompas|romper(?:ás|á)\\s+tu\\s+racha")),
];

/** Devuelve cada patrón prohibido presente en `text` (lista vacía = copy permitido). */
export function findForbiddenPhrases(
  text: string,
  options: FindForbiddenPhrasesOptions = {}
): ForbiddenPhraseFinding[] {
  const { categories } = options;
  return FORBIDDEN_COPY_PATTERNS.filter(
    (candidate) => !categories || categories.includes(candidate.category)
  ).flatMap(({ id, category, pattern }) => {
    const found = pattern.exec(text);
    return found ? [{ id, category, match: found[0] }] : [];
  });
}
