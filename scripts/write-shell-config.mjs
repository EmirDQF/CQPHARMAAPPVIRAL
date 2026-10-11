// Escribe capacitor-shell/shell-config.js con la URL de la app remota para que
// la pantalla sin conexión pueda volver a ella. Corre antes de `cap sync`.
// Solo acepta https sin credenciales; el valor por defecto coincide con
// capacitor.config.ts. El archivo generado no se versiona.
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_APP_URL = "https://artikare.com";
const OUTPUT = join("capacitor-shell", "shell-config.js");

function readAppUrl() {
  const raw = process.env.CAP_SERVER_URL ?? DEFAULT_APP_URL;
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("CAP_SERVER_URL debe ser una URL https sin credenciales");
  }
  return url.href;
}

try {
  const config = { appUrl: readAppUrl() };
  writeFileSync(OUTPUT, `window.ARTIKARE_SHELL_CONFIG = ${JSON.stringify(config)};\n`);
  process.stdout.write(`shell-config.js escrito en ${OUTPUT}\n`);
} catch (error) {
  process.stderr.write(`No se pudo escribir shell-config.js: ${error instanceof Error ? error.message : "error"}\n`);
  process.exit(1);
}
