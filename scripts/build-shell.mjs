// Genera capacitor-shell/ (webDir de Capacitor, no versionado) desde
// capacitor-shell-src/: index.html con la URL de la app y offline.js
// incrustados y la CSP por hash. Corre antes de `cap sync`. La URL sale de la
// misma lógica que capacitor.config.ts (CAP_ENV + CAP_SERVER_URL).
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { resolveCapacitorServer } from "../src/lib/env/capacitorEnv.ts";
import { buildShellPage } from "../src/lib/native/shellPage.ts";

const SOURCE_DIR = "capacitor-shell-src";
const OUTPUT_DIR = "capacitor-shell";

try {
  const { env, url } = resolveCapacitorServer(process.env);
  const template = readFileSync(join(SOURCE_DIR, "index.html"), "utf8");
  const offlineJs = readFileSync(join(SOURCE_DIR, "offline.js"), "utf8");
  rmSync(OUTPUT_DIR, { recursive: true, force: true });
  mkdirSync(OUTPUT_DIR);
  writeFileSync(join(OUTPUT_DIR, "index.html"), buildShellPage(template, offlineJs, url));
  process.stdout.write(`Shell offline generado en ${OUTPUT_DIR}/index.html (CAP_ENV=${env})\n`);
} catch (error) {
  process.stderr.write(`No se pudo generar el shell offline: ${error instanceof Error ? error.message : "error"}\n`);
  process.exit(1);
}
