// npm run verify-env [-- --strict]: revisa las variables de entorno antes de
// compilar. Imprime solo nombres de variables, nunca valores. Node 24 ejecuta
// este TypeScript sin compilarlo (type stripping).
import { verifyEnv } from "../src/lib/env/verifyEnv.ts";

const strict = process.argv.includes("--strict");
const report = verifyEnv(process.env, { strict });

report.warnings.forEach((line) => process.stdout.write(`aviso: ${line}\n`));
report.errors.forEach((line) => process.stderr.write(`error: ${line}\n`));

if (report.errors.length > 0) {
  process.stderr.write(`verify-env: ${report.errors.length} error(es)${strict ? " (modo estricto)" : ""}.\n`);
  process.exit(1);
}
process.stdout.write(
  `verify-env: OK${strict ? " (modo estricto)" : ` con ${report.warnings.length} aviso(s) (usa --strict para release)`}.\n`
);
