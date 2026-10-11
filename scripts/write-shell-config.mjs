// Escribe capacitor-shell/shell-config.js con la URL de la app remota para que
// la pantalla sin conexión pueda volver a ella. Corre antes de `cap sync`.
// La URL sale de la misma lógica que capacitor.config.ts (CAP_ENV +
// CAP_SERVER_URL): http solo a loopback en dev, https público en release.
// El archivo generado no se versiona.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { resolveCapacitorServer } from "../src/lib/env/capacitorEnv.ts";

const OUTPUT = join("capacitor-shell", "shell-config.js");

try {
  const { env, url } = resolveCapacitorServer(process.env);
  writeFileSync(OUTPUT, `window.ARTIKARE_SHELL_CONFIG = ${JSON.stringify({ appUrl: url })};\n`);
  process.stdout.write(`shell-config.js escrito en ${OUTPUT} (CAP_ENV=${env})\n`);
} catch (error) {
  process.stderr.write(`No se pudo escribir shell-config.js: ${error instanceof Error ? error.message : "error"}\n`);
  process.exit(1);
}
