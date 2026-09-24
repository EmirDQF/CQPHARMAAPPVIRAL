import { expect, test, type Page } from "@playwright/test";

/** Smoke test móvil (375px): flujos críticos sin errores de consola ni scroll horizontal. */

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test("test de edad articular completo muestra resultado con descargo", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto("/");
  await expectNoHorizontalOverflow(page);

  await page.getByRole("button", { name: "Evaluar mi Salud Ósea Gratis" }).click();
  await page.locator("#age").fill("58");
  await page.getByRole("radio", { name: "femenino" }).click();
  await page.getByRole("button", { name: "Siguiente" }).click();

  const disclaimer = page.getByText(/Este test es orientativo y no reemplaza un diagnóstico médico/);
  for (let answered = 0; answered < 10 && !(await disclaimer.isVisible()); answered += 1) {
    await page.getByRole("radio").first().click();
  }

  await expect(disclaimer).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test("/citas exige consentimiento antes de confirmar", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto("/citas");

  await page.getByRole("button").filter({ hasText: /densitometr/i }).first().click();
  // La disponibilidad depende de la fecha real: se recorren días hasta hallar un turno libre.
  const dayButtons = page.locator("button[aria-pressed]");
  const openSlots = page
    .getByRole("button")
    .filter({ hasText: /Mañana|Tarde/ })
    .and(page.locator(":enabled"));
  const dayCount = await dayButtons.count();
  for (let index = 0; index < dayCount; index += 1) {
    await dayButtons.nth(index).click();
    await expect(dayButtons.nth(index)).toHaveAttribute("aria-pressed", "true");
    if ((await openSlots.count()) > 0) break;
  }
  await openSlots.first().click();

  await page.getByPlaceholder("Ej. María Torres").fill("Paciente Prueba");
  await page.getByPlaceholder("Ej. 58").fill("60");
  await page.getByPlaceholder("Ej. 987654321").fill("987654321");

  const consent = page.getByRole("checkbox");
  const confirm = page.getByRole("button", { name: "Confirmar Cita" });
  await expect(consent).not.toBeChecked();
  await expect(confirm).toBeDisabled();

  await consent.check();
  await expect(confirm).toBeEnabled();
  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

for (const path of ["/app", "/app/reporte-medico"]) {
  test(`${path} sin densitometría no inventa T-scores`, async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto(path);
    if (path === "/app") await page.getByRole("button", { name: /Mi Hueso/ }).click();

    await expect(page.getByText("Sin densitometría registrada").first()).toBeVisible();
    await expect(page.getByText("Sube tu densitometría").first()).toBeVisible();
    await expect(page.getByText("Agendar densitometría").first()).toBeVisible();
    await expect(page.getByText(/T-?Score:?\s*-?\d/i)).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    expect(errors).toEqual([]);
  });
}

test("/privacidad carga la política provisional", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto("/privacidad");
  await expect(page.getByRole("heading", { name: "Política de Privacidad" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});
