import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { articles } from "../articles";
import { findForbiddenPhrases } from "./forbiddenCopy";

/**
 * Barrido de todo el texto que ve una persona (app, landing, blog,
 * notificaciones, manifest, shell offline y ficha de Play): ninguna promesa de
 * cura, reversión, regeneración, reparación, garantía ni de reemplazar al médico.
 */
const ROOT = process.cwd();
const SOURCE_DIRS = ["src"];
const EXTRA_FILES = ["public/manifest.json", "capacitor-shell-src/index.html", "docs/PLAY-LISTING.md"];
/** Define las reglas y sus ejemplos: es el único lugar donde las frases deben aparecer. */
const RULE_FILES = new Set(["src/lib/clinical/forbiddenCopy.ts"]);

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listSourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

/** Los comentarios del código no son texto visible (p. ej. "RLS garantiza que…"). */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
}

const files = [
  ...SOURCE_DIRS.flatMap((dir) => listSourceFiles(join(ROOT, dir))),
  ...EXTRA_FILES.map((file) => join(ROOT, file)),
]
  .map((path) => relative(ROOT, path).replaceAll("\\", "/"))
  .filter((path) => !RULE_FILES.has(path));

describe("lenguaje clínico permitido en todo el texto visible", () => {
  it.each(files)("%s no promete cura, reversión ni garantía", (file) => {
    const text = stripComments(readFileSync(join(ROOT, file), "utf8"));
    expect(findForbiddenPhrases(text, { categories: ["cura-reversion"] })).toEqual([]);
  });

  it.each(articles.map((article) => [article.slug, article] as const))("el artículo %s tampoco (título y cuerpo)", (_slug, article) => {
    const text = [article.title, article.excerpt, ...article.content].join("\n");
    expect(findForbiddenPhrases(text, { categories: ["cura-reversion"] })).toEqual([]);
  });

  it("todo artículo recuerda que no reemplaza al médico", () => {
    articles.forEach((article) => expect(article.content.join(" "), article.slug).toMatch(/no reemplaza/i));
  });
});
