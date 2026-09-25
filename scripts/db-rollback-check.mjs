// Prueba up → down → up de todas las migraciones contra el Supabase LOCAL.
// Supabase solo aplica migraciones hacia adelante; cada una tiene su inverso en
// supabase/rollbacks/<ts>_<nombre>.down.sql. Reinicia la base local (borra sus datos).
import { execFileSync, execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DB_CONTAINER = "supabase_db_artikare";
const MIGRATIONS_DIR = join("supabase", "migrations");
const ROLLBACKS_DIR = join("supabase", "rollbacks");
const EXPECTED_TABLES = [
  "profiles",
  "consents",
  "assessments",
  "dexa_scans",
  "pain_logs",
  "products",
  "dose_events",
  "bottles",
  "appointments",
];

function runSql(sql) {
  return execFileSync(
    "docker",
    ["exec", "-i", DB_CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-q", "-t", "-A", "-1"],
    { input: sql, encoding: "utf8" }
  ).trim();
}

function countTables() {
  const list = EXPECTED_TABLES.map((table) => `'${table}'`).join(", ");
  return Number(
    runSql(`select count(*) from pg_tables where schemaname = 'public' and tablename in (${list});`)
  );
}

function countTypes() {
  return Number(
    runSql(
      "select count(*) from pg_type t join pg_namespace n on n.oid = t.typnamespace " +
        "where n.nspname = 'public' and t.typtype = 'e';"
    )
  );
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: se esperaba ${expected}, se obtuvo ${actual}`);
  }
  console.log(`ok - ${label}`);
}

const migrations = readdirSync(MIGRATIONS_DIR).filter((file) => file.endsWith(".sql")).sort();
const rollbacks = migrations.map((file) => file.replace(/\.sql$/, ".down.sql"));

for (const rollback of rollbacks) {
  if (!existsSync(join(ROLLBACKS_DIR, rollback))) {
    throw new Error(`Falta el rollback ${rollback}`);
  }
}
console.log(`ok - cada una de las ${migrations.length} migraciones tiene su rollback`);

// Comando fijo, sin argumentos interpolados (npx necesita shell en Windows).
execSync("npx supabase db reset", { stdio: "ignore" });
assertEqual(countTables(), EXPECTED_TABLES.length, "up: las 9 tablas existen");

for (const rollback of [...rollbacks].reverse()) {
  runSql(readFileSync(join(ROLLBACKS_DIR, rollback), "utf8"));
}
assertEqual(countTables(), 0, "down: no queda ninguna tabla");
assertEqual(countTypes(), 0, "down: no queda ningún enum");

for (const migration of migrations) {
  runSql(readFileSync(join(MIGRATIONS_DIR, migration), "utf8"));
}
assertEqual(countTables(), EXPECTED_TABLES.length, "up de nuevo: las 9 tablas existen");
assertEqual(Number(runSql("select count(*) from public.products;")), 2, "up de nuevo: catálogo sembrado");
