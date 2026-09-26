import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { findSupabaseImportViolations, type SourceFile } from "./architecture";

const ROOT = process.cwd();
const CODE_FILE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
/** Código de la app y scripts. supabase/tests/** es el arnés de pruebas contra la base, no código de la app. */
const SCANNED_DIRS = ["src", "scripts"];
const IGNORED_DIRS = new Set(["node_modules", ".next"]);

function collectFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    if (IGNORED_DIRS.has(name)) return [];
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return collectFiles(path);
    return CODE_FILE.test(name) ? [path] : [];
  });
}

function readSourceFiles(): SourceFile[] {
  const rootFiles = readdirSync(ROOT)
    .filter((name) => CODE_FILE.test(name))
    .map((name) => join(ROOT, name));
  const nestedFiles = SCANNED_DIRS.flatMap((dir) => collectFiles(join(ROOT, dir)));
  return [...rootFiles, ...nestedFiles].map((path) => ({
    path: relative(ROOT, path).split(sep).join("/"),
    content: readFileSync(path, "utf8"),
  }));
}

// El nombre del paquete se arma por partes para que este archivo no se detecte a sí mismo.
const SUPABASE = ["@", "supabase/"].join("");

describe("findSupabaseImportViolations", () => {
  it("detects static, dynamic and require imports outside src/lib/repositories", () => {
    const files: SourceFile[] = [
      { path: "src/components/A.tsx", content: `import { createClient } from "${SUPABASE}supabase-js";` },
      { path: "src/app/b.ts", content: `const mod = await import('${SUPABASE}ssr');` },
      { path: "proxy.ts", content: `const x = require("${SUPABASE}ssr");` },
      { path: "src/lib/c.ts", content: `export type { User } from "${SUPABASE}supabase-js";` },
    ];
    expect(findSupabaseImportViolations(files)).toEqual([
      "src/components/A.tsx",
      "src/app/b.ts",
      "proxy.ts",
      "src/lib/c.ts",
    ]);
  });

  it("allows src/lib/repositories/** and src/lib/supabase/**, and ignores text that is not an import", () => {
    const files: SourceFile[] = [
      { path: "src/lib/repositories/supabase/client.ts", content: `import { createClient } from "${SUPABASE}supabase-js";` },
      { path: "src/lib/supabase/client.ts", content: `import { createBrowserClient } from "${SUPABASE}ssr";` },
      { path: "src/lib/notes.ts", content: `// Supabase guarda los datos en ${SUPABASE}...` },
    ];
    expect(findSupabaseImportViolations(files)).toEqual([]);
  });
});

describe("arquitectura del repositorio", () => {
  it("solo src/lib/repositories/** y src/lib/supabase/** importan Supabase", () => {
    expect(findSupabaseImportViolations(readSourceFiles())).toEqual([]);
  });
});
