import { expect, test } from "@playwright/test";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { buildShellPage } from "../src/lib/native/shellPage";

/**
 * Pantalla de respaldo del WebView nativo: se arma con buildShellPage igual que
 * scripts/build-shell.mjs (todo incrustado, CSP por hash) y se abre como archivo
 * local, como la sirve Capacitor con server.errorPath.
 */
const APP_URL = "https://artikare.test/";
const SOURCE_DIR = join(process.cwd(), "capacitor-shell-src");

function writeShellPage(): string {
  const html = buildShellPage(
    readFileSync(join(SOURCE_DIR, "index.html"), "utf8"),
    readFileSync(join(SOURCE_DIR, "offline.js"), "utf8"),
    APP_URL
  );
  const file = join(mkdtempSync(join(tmpdir(), "artikare-shell-")), "index.html");
  writeFileSync(file, html);
  return pathToFileURL(file).href;
}

test("sin conexión explica la situación y vuelve a la app al recuperar la red", async ({ page, context }) => {
  const shellUrl = writeShellPage();
  await page.route("https://**/*", (route) =>
    route.fulfill({ contentType: "text/html", body: "<h1>App remota</h1>" })
  );

  await context.setOffline(true);
  await page.goto(shellUrl);

  await expect(page.getByRole("heading", { name: "No pudimos abrir Artikare" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("sin conexión a internet");
  await expect(page.getByRole("button", { name: "Reintentar" })).toBeVisible();

  await context.setOffline(false);
  await expect(page).toHaveURL(APP_URL);
  await expect(page.getByRole("heading", { name: "App remota" })).toBeVisible();
});
