import { expect, test, type Page } from "@playwright/test";

/** Flujos diarios de Mi Panel (375px): semáforo óseo, pastillero y diario de dolor. */

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

const POSTMENOPAUSAL_PROFILE = {
  name: "Paciente Prueba",
  age: 63,
  sex: "femenino",
  weightKg: null,
  hasFractureHistory: false,
  menopausalStatus: "posmenopausica",
  allergies: "",
  phone: "",
  consent: { consentAt: "2026-09-01T15:00:00.000Z", consentVersion: "2026-09-v1" },
};

async function seedPostmenopausalPatient(page: Page, lumbarTScore: number): Promise<void> {
  await page.addInitScript(
    ({ profile, tScore }) => {
      window.localStorage.setItem("artikare_patient_profile_v1", JSON.stringify(profile));
      window.localStorage.setItem(
        "artikare_dexa_vault_v1",
        JSON.stringify([
          {
            id: "dexa-1",
            date: "2026-08-15",
            lumbarTScore: tScore,
            femoralNeckTScore: -1.2,
            radiologyCenter: "Centro de prueba",
          },
        ])
      );
    },
    { profile: POSTMENOPAUSAL_PROFILE, tScore: lumbarTScore }
  );
}

test("T-score de -2.5 exacto es osteoporosis y pone al reumatólogo antes que cualquier producto", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await seedPostmenopausalPatient(page, -2.5);
  await page.goto("/app");

  const redFlag = page.getByRole("region", { name: /Requiere evaluación reumatológica/ });
  await expect(redFlag).toBeVisible();

  await page.getByRole("button", { name: /Mi Hueso/ }).click();
  await expect(page.getByText("Osteoporosis").first()).toBeVisible();
  await expect(page.getByText("-2.5").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Agendar evaluación reumatológica" }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("T-score de -1.6 se muestra como osteopenia sin bandera roja", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await seedPostmenopausalPatient(page, -1.6);
  await page.goto("/app");
  await page.getByRole("button", { name: /Mi Hueso/ }).click();

  await expect(page.getByText("Osteopenia").first()).toBeVisible();
  await expect(page.getByRole("region", { name: /Requiere evaluación reumatológica/ })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("el pastillero marca la toma y la recuerda al recargar", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto("/app");

  const pillbox = page.locator("section").filter({ has: page.getByRole("heading", { name: "Pastillero Inteligente" }) });
  const pending = pillbox.getByRole("button", { name: "Tomar", exact: true });
  const doseCount = await pending.count();
  expect(doseCount).toBeGreaterThan(0);
  // La racha cuenta días completos: se marcan todas las tomas de hoy.
  for (let index = 0; index < doseCount; index += 1) await pending.first().click();
  await expect(pillbox.getByRole("button", { name: "✓ Tomado" })).toHaveCount(doseCount);
  await expect(pillbox.getByText(/Racha: 1 día/)).toBeVisible();

  await page.reload();
  await expect(pillbox.getByRole("button", { name: "✓ Tomado" })).toHaveCount(doseCount);
  expect(errors).toEqual([]);
});

test("el diario de dolor guarda el registro de hoy", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto("/app");

  const checkIn = page.locator("section").filter({
    has: page.getByRole("heading", { name: "¿Cómo amanecieron tus articulaciones hoy?" }),
  });
  const save = checkIn.getByRole("button", { name: "Guardar registro de hoy" });
  await expect(save).toBeDisabled();

  await checkIn.getByRole("button", { name: "4", exact: true }).click();
  await checkIn.getByRole("button", { name: "0–15 min" }).click();
  await save.click();

  await expect(checkIn.getByRole("status")).toContainText("Registraste tu día");
  await page.reload();
  await expect(checkIn.getByRole("button", { name: /Registrado hoy/ })).toBeVisible();
  expect(errors).toEqual([]);
});
