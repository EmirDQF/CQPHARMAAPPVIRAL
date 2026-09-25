export interface SourceFile {
  /** Ruta relativa a la raíz del repo, con "/". */
  path: string;
  content: string;
}

/** Repository Pattern: solo los adaptadores de src/lib/repositories/** hablan con Supabase. */
const ALLOWED_PREFIX = "src/lib/repositories/";

// import ... from "pkg" · export ... from "pkg" · import "pkg" · import("pkg") · require("pkg")
const SUPABASE_IMPORT =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)["']@supabase\//;

export function findSupabaseImportViolations(files: readonly SourceFile[]): string[] {
  return files
    .filter((file) => !file.path.startsWith(ALLOWED_PREFIX))
    .filter((file) => SUPABASE_IMPORT.test(file.content))
    .map((file) => file.path);
}
