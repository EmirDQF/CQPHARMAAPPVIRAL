import { expect, test } from "@playwright/test";

/** Ajustes (C5, 375 px): los derechos ARCO se ejercen en la app, con confirmación explícita. */

test("desde Mi Panel se llega a Ajustes y se ven los cuatro derechos", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/app");
  await page.getByRole("link", { name: "Ajustes y privacidad" }).click();

  await expect(page.getByRole("heading", { name: "Ajustes y privacidad" })).toBeVisible();
  for (const name of ["Descargar mis datos", "Corregir mis datos", "Retirar autorizaciones", "Borrar mi cuenta y mis datos"]) {
    await expect(page.getByRole("heading", { name })).toBeVisible();
  }
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test("como invitado, ver mis datos y luego borrarlos deja el celular limpio", async ({ page }) => {
  await page.goto("/app/ajustes");
  await page.evaluate(() =>
    window.localStorage.setItem("artikare_pain_log_v1", JSON.stringify([{ date: "2026-10-01", painLevel: 3, stiffness: "0-15" }]))
  );
  await page.reload();

  await page.getByRole("button", { name: "Ver mis datos aquí" }).click();
  await expect(page.getByLabel("Mis datos en formato JSON")).toContainText("diarioDeDolorYRigidez");

  await page.getByRole("button", { name: "Borrar mi cuenta y mis datos" }).click();
  const dialog = page.getByRole("dialog", { name: "¿Borrar todos tus datos?" });
  await expect(dialog.getByRole("button", { name: "Borrar definitivamente" })).toBeDisabled();
  await dialog.getByRole("checkbox", { name: "Entiendo que el borrado es definitivo." }).check();
  await dialog.getByRole("button", { name: "Borrar definitivamente" }).click();

  await expect(page.getByRole("status").filter({ hasText: "borramos tus datos" })).toBeVisible();
  const remainingKeys = await page.evaluate(() =>
    Object.keys(window.localStorage).filter((key) => key.startsWith("artikare_"))
  );
  expect(remainingKeys).toEqual([]);
});
