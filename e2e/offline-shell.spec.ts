import { expect, test } from "@playwright/test";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

/**
 * Pantalla de respaldo del WebView nativo (capacitor-shell/index.html): se
 * abre como archivo local, igual que la carga Capacitor con server.errorPath.
 */
const SHELL_URL = pathToFileURL(join(process.cwd(), "capacitor-shell", "index.html")).href;
const APP_URL = "https://artikare.test/";

test("sin conexión explica la situación y vuelve a la app al recuperar la red", async ({ page, context }) => {
  await page.addInitScript((appUrl) => {
    Object.defineProperty(window, "ARTIKARE_SHELL_CONFIG", {
      value: { appUrl },
      writable: false,
      configurable: false,
    });
  }, APP_URL);
  await page.route("https://**/*", (route) =>
    route.fulfill({ contentType: "text/html", body: "<h1>App remota</h1>" })
  );

  await context.setOffline(true);
  await page.goto(SHELL_URL);

  await expect(page.getByRole("heading", { name: "No pudimos abrir Artikare" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("sin conexión a internet");
  await expect(page.getByRole("button", { name: "Reintentar" })).toBeVisible();

  await context.setOffline(false);
  await expect(page).toHaveURL(APP_URL);
  await expect(page.getByRole("heading", { name: "App remota" })).toBeVisible();
});
