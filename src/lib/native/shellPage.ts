import { createHash } from "node:crypto";

/**
 * Arma la pantalla sin conexión del WebView (capacitor-shell/index.html) a
 * partir de capacitor-shell-src/. Con server.url, Capacitor 8 solo sirve desde
 * el APK la URL exacta del errorPath; todo lo demás va por proxy al servidor
 * remoto, que justo está caído. Por eso la config y offline.js van incrustados,
 * y la CSP los admite por hash sha256 (nunca 'unsafe-inline' para scripts).
 * Solo lo usa scripts/build-shell.mjs (Node): imports sin alias.
 */
const SCRIPT_PLACEHOLDER = "__SHELL_SCRIPT__";
const HASH_PLACEHOLDER = "__SHELL_SCRIPT_HASH__";
const SCRIPT_CLOSE = /<\/script/i;

/** JSON seguro dentro de <script>: "<" escapado impide cerrar la etiqueta. */
function toInlineJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function buildShellPage(template: string, offlineJs: string, appUrl: string): string {
  if (!template.includes(SCRIPT_PLACEHOLDER) || !template.includes(HASH_PLACEHOLDER)) {
    throw new Error(`La plantilla del shell perdió ${SCRIPT_PLACEHOLDER} o ${HASH_PLACEHOLDER}`);
  }
  if (SCRIPT_CLOSE.test(offlineJs)) throw new Error("offline.js no puede contener </script>");

  // El parser HTML convierte CRLF en LF antes de calcular el hash de la CSP; un
  // checkout de Windows (autocrlf) dejaría la página sin script.
  const body = offlineJs.trim().replace(/\r\n?/g, "\n");
  const script = `\nwindow.ARTIKARE_SHELL_CONFIG = ${toInlineJson({ appUrl })};\n${body}\n`;
  const hash = createHash("sha256").update(script, "utf8").digest("base64");
  return template.replace(HASH_PLACEHOLDER, `'sha256-${hash}'`).replace(SCRIPT_PLACEHOLDER, () => script);
}
