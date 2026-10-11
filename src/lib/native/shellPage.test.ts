import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildShellPage } from "./shellPage";

const TEMPLATE = readFileSync(join(process.cwd(), "capacitor-shell-src", "index.html"), "utf8");
const OFFLINE_JS = readFileSync(join(process.cwd(), "capacitor-shell-src", "offline.js"), "utf8");
const CR = String.fromCharCode(13);
const CRLF = `${CR}\n`;

function inlineScript(html: string): string {
  return /<script>([\s\S]*)<\/script>/.exec(html)?.[1] ?? "";
}

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("base64");
}

describe("buildShellPage", () => {
  it("inlines the config and offline.js with no external scripts", () => {
    const html = buildShellPage(TEMPLATE, OFFLINE_JS, "https://app.ejemplo.pe/");
    expect(html).not.toMatch(/<script[^>]+src=/);
    expect(html).not.toContain("__SHELL_");
    expect(inlineScript(html)).toContain('window.ARTIKARE_SHELL_CONFIG = {"appUrl":"https://app.ejemplo.pe/"};');
    expect(inlineScript(html)).toContain("function resolveAppUrl(config)");
  });

  it("allows exactly that script through a sha256 CSP hash, never unsafe-inline for scripts", () => {
    const html = buildShellPage(TEMPLATE, OFFLINE_JS, "https://app.ejemplo.pe/");
    expect(html).toContain(`script-src 'sha256-${sha256(inlineScript(html))}'`);
    expect(html).not.toMatch(/script-src[^;"]*unsafe-inline/);
  });

  it("hashes LF line endings, as the HTML parser normalizes a CRLF checkout", () => {
    const html = buildShellPage(TEMPLATE, `var a = 1;${CRLF}var b = 2;${CRLF}`, "https://app.ejemplo.pe/");
    const script = inlineScript(html);
    expect(script).not.toContain(CR);
    expect(html).toContain(`'sha256-${sha256(script)}'`);
  });

  it("escapes the URL so it cannot close the script tag", () => {
    const html = buildShellPage(TEMPLATE, OFFLINE_JS, "https://app.ejemplo.pe/</script><script>alert(1)//");
    expect(html.match(/<\/script>/g)).toHaveLength(1);
  });

  it("fails loudly if the template lost a placeholder", () => {
    expect(() => buildShellPage("<html></html>", OFFLINE_JS, "https://app.ejemplo.pe/")).toThrow(/plantilla/);
  });
});
