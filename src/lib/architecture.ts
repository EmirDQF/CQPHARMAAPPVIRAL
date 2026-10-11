export interface SourceFile {
  /** Ruta relativa a la raíz del repo, con "/". */
  path: string;
  content: string;
}

/**
 * Repository Pattern: solo los adaptadores de src/lib/repositories/** y la
 * conexión de src/lib/supabase/** (clientes, sesión, proxy) hablan con Supabase.
 */
const ALLOWED_PREFIXES = ["src/lib/repositories/", "src/lib/supabase/"];

// import ... from "pkg" · export ... from "pkg" · import "pkg" · import("pkg") · require("pkg")
const SUPABASE_IMPORT =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)["']@supabase\//;

/**
 * La service role (src/lib/supabase/admin.ts) solo se importa desde rutas API:
 * cualquier otro módulo podría terminar en un bundle de cliente.
 */
const ADMIN_ALLOWED_PREFIX = "src/app/api/";
const ADMIN_MODULE_PATH = "src/lib/supabase/admin.ts";
const ADMIN_IMPORT = /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)["'][^"']*supabase\/admin["']/;

export function findAdminImportViolations(files: readonly SourceFile[]): string[] {
  return files
    .filter((file) => !file.path.startsWith(ADMIN_ALLOWED_PREFIX) && file.path !== ADMIN_MODULE_PATH)
    .filter((file) => ADMIN_IMPORT.test(file.content))
    .map((file) => file.path);
}

export function findSupabaseImportViolations(files: readonly SourceFile[]): string[] {
  return files
    .filter((file) => !ALLOWED_PREFIXES.some((prefix) => file.path.startsWith(prefix)))
    .filter((file) => SUPABASE_IMPORT.test(file.content))
    .map((file) => file.path);
}
