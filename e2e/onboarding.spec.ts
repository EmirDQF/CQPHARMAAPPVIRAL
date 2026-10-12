import { expect, test } from "@playwright/test";

/** Primer arranque (375 px): splash → bienvenida → consentimiento → perfil → metas → Hoy, una sola vez. */
test.use({ storageState: { cookies: [], origins: [] } });

test("una persona nueva completa el primer arranque y llega a Hoy; no se repite", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/app");
  await page.getByRole("button", { name: /Toca para continuar/ }).click();
  await page.getByRole("button", { name: "¡Vamos! 🎉" }).click();
  await page.getByRole("button", { name: "¡Me gusta! 💪" }).click();

  await expect(page.getByRole("heading", { name: /Tus datos, tus reglas/ })).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Acepto y sigo/ }).click();

  await page.getByLabel("¿Cómo te llamo?").fill("Rosa");
  await page.getByLabel(/Fecha de nacimiento/).fill("1961-04-02");
  await page.getByText("Femenino", { exact: true }).click();
  await page.getByText("Ya pasé la menopausia").click();
  await page.getByRole("button", { name: "Guardar y seguir" }).click();

  await expect(page.getByRole("heading", { name: /Tu meta diaria/ })).toBeVisible();
  await page.getByRole("button", { name: /¡Listo!/ }).click();
  await expect(page.getByRole("heading", { name: "¡Todo listo, Rosa! 🎉" })).toBeVisible();
  await page.getByRole("button", { name: /Ir a Hoy/ }).click();

  await expect(page.getByRole("heading", { name: "¿Cómo amanecieron tus articulaciones hoy?" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  await page.reload();
  await expect(page.getByRole("heading", { name: "¿Cómo amanecieron tus articulaciones hoy?" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Toca para continuar/ })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("quien ya tenía perfil guardado no repite el primer arranque", async ({ page }) => {
  await page.addInitScript(() =>
    window.localStorage.setItem(
      "artikare_patient_profile_v1",
      JSON.stringify({ name: "Luis", age: 61, sex: "masculino", weightKg: null, hasFractureHistory: null, menopausalStatus: null, allergies: "", phone: "" })
    )
  );
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "¿Cómo amanecieron tus articulaciones hoy?" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Toca para continuar/ })).toHaveCount(0);
});
