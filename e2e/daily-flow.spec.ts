import { expect, test, type Page } from "@playwright/test";

/**
 * Flujo diario completo guiado por "Tu siguiente paso" (375 px):
 * abrir → chequeo → tomas → actividad guiada → autorreporte → meta cumplida.
 * Reloj fijo para que la rotación de misiones sea siempre la misma.
 */
const FIXED_NOW = new Date("2026-10-12T14:00:00.000Z"); // 09:00 en Lima
const NIGHT_DOSE_TIME = new Date("2026-10-13T02:35:00.000Z"); // 21:35 en Lima, mismo día
const NIGHT_DOSE_STEP = "Siguiente paso: Toma de la noche";
const MAX_STEPS = 8;

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function finishGuidedSheet(page: Page): Promise<void> {
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("button", { name: /Empezar/ }).click();
  const done = sheet.getByRole("button", { name: /Terminé/ });
  for (let step = 0; step < MAX_STEPS && !(await done.isEnabled()); step += 1) {
    await sheet.getByRole("button", { name: "Siguiente paso", exact: true }).click();
  }
  await done.click();
  await expect(sheet).toHaveCount(0);
}

/** Sigue "Tu siguiente paso" hasta que no quede nada realizable; devuelve los pasos ofrecidos. */
async function followNextSteps(page: Page): Promise<string[]> {
  const checkIn = page.locator("section").filter({
    has: page.getByRole("heading", { name: "¿Cómo amanecieron tus articulaciones hoy?" }),
  });
  const offered: string[] = [];
  for (let step = 0; step < MAX_STEPS; step += 1) {
    const next = page.getByRole("button", { name: /^Siguiente paso:/ });
    if ((await next.count()) === 0) return offered;
    const label = (await next.getAttribute("aria-label")) ?? "";
    offered.push(label);
    await next.click();
    if (/Chequeo/.test(label)) {
      await checkIn.getByRole("button", { name: "4", exact: true }).click();
      await checkIn.getByRole("button", { name: "0–15 min" }).click();
      await checkIn.getByRole("button", { name: "Guardar registro de hoy" }).click();
      await expect(checkIn.getByRole("status")).toContainText("Registraste tu día");
    } else if (await page.getByRole("dialog").count()) {
      await finishGuidedSheet(page);
    }
    await expect(page.getByRole("button", { name: label })).toHaveCount(0);
  }
  return offered;
}

/** Mañana: todo lo realizable, sin la toma nocturna. Noche: la toma de las 21:30 y la meta. */
async function completeDayWithNextStep(page: Page): Promise<void> {
  expect(await followNextSteps(page)).not.toContain(NIGHT_DOSE_STEP);

  await page.clock.setFixedTime(NIGHT_DOSE_TIME);
  await page.reload();
  expect(await followNextSteps(page)).toContain(NIGHT_DOSE_STEP);
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(FIXED_NOW);
});

test("'Tu siguiente paso' lleva de principio a fin hasta celebrar la meta del día", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/app");

  await expect(page.getByRole("button", { name: "Siguiente paso: Chequeo de la mañana" })).toBeVisible();
  await completeDayWithNextStep(page);

  await expect(page.getByText(/¡Meta cumplida!/)).toBeVisible();
  await expect(page.getByRole("button", { name: /^Siguiente paso:/ })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("con letra 'Muy grande' se aplica al abrir, pasa a lectura fácil y el flujo sigue usable", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/app/ajustes");
  await page.getByRole("button", { name: "Muy grande" }).click();

  await page.goto("/app");
  // Ya aplicado en el HTML inicial (sin parpadeo): el script de <head> lo pone antes de hidratar.
  expect(await page.evaluate(() => document.documentElement.dataset.textSize)).toBe("xlarge");
  await expect(page.getByTestId("mission-description").first()).toBeHidden();
  await expect(page.locator("section[aria-labelledby='misiones-hoy'] h3").first()).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  await completeDayWithNextStep(page);
  await expect(page.getByText(/¡Meta cumplida!/)).toBeVisible();
  expect(errors).toEqual([]);
});
