import { expect, test } from "@playwright/test";

/** Flujo de hábito diario (375 px): tomar → progreso del día → logro por constancia. */
test("marcar las tomas sube el progreso del día y desbloquea el primer logro", async ({ page }) => {
  await page.goto("/app");

  const ring = page.getByRole("img", { name: /Meta de hoy/ });
  await expect(ring).toHaveAccessibleName(/0 de 5/);

  const take = page.locator("section#pastillero").getByRole("button", { name: "Ya me la tomé" });
  await expect(take.first()).toBeVisible();
  const doseCount = await take.count();
  for (let index = 0; index < doseCount; index += 1) await take.first().click();
  await expect(ring).toHaveAccessibleName(new RegExp(`${doseCount} de 5`));

  const confirm = page.locator("section#pastillero").getByRole("button", { name: "Listo" });
  for (let index = 0; index < doseCount; index += 1) await confirm.first().click();
  const celebration = page.getByRole("region", { name: "¡Nuevo logro!" });
  await expect(celebration.getByRole("status")).toContainText("Primer día completo");

  await celebration.getByRole("button", { name: "Ver mis logros" }).click();
  await expect(page.getByRole("heading", { name: "Mis logros" })).toBeVisible();
  await expect(page.getByText("Primer día completo")).toBeVisible();

  await page.getByRole("button", { name: /Mi día/ }).click();
  await expect(page.getByRole("region", { name: "¡Nuevo logro!" })).toHaveCount(0);
});
