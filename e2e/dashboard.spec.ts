import { expect, test, type Page } from "@playwright/test";
import { UNDO_WINDOW_MS } from "../src/lib/clinical/constants";

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

  await page.getByRole("button", { name: /Progreso/ }).click();
  await expect(page.getByText("Osteoporosis").first()).toBeVisible();
  await expect(page.getByText("-2.5").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Agendar evaluación reumatológica" }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("T-score de -1.6 se muestra como osteopenia sin bandera roja", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await seedPostmenopausalPatient(page, -1.6);
  await page.goto("/app");
  await page.getByRole("button", { name: /Progreso/ }).click();

  await expect(page.getByText("Osteopenia").first()).toBeVisible();
  await expect(page.getByRole("region", { name: /Requiere evaluación reumatológica/ })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("el pastillero anota la toma, permite deshacer y la guarda al cerrar la ventana", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.clock.install();
  await page.goto("/app");

  const pillbox = page.locator("section#pastillero");
  const take = pillbox.getByRole("button", { name: "Ya me la tomé" });
  await expect(take.first()).toBeVisible();
  const doseCount = await take.count();
  expect(doseCount).toBeGreaterThan(0);

  await take.first().click();
  await pillbox.getByRole("button", { name: /Deshacer/ }).click();
  await expect(take).toHaveCount(doseCount);

  // La racha cuenta días completos: se anotan todas las tomas de hoy.
  for (let index = 0; index < doseCount; index += 1) await take.first().click();
  await expect(pillbox.getByText("✓ Anotada")).toHaveCount(doseCount);
  await page.clock.runFor(UNDO_WINDOW_MS);
  await expect(pillbox.getByText("✓ Tomada", { exact: true })).toHaveCount(doseCount);
  await expect(page.getByText("1 día seguido")).toBeVisible();
  await expect(page.getByRole("img", { name: /Progreso de hoy: 2 de 3/ })).toBeVisible();

  await page.reload();
  await expect(pillbox.getByText("✓ Tomada", { exact: true })).toHaveCount(doseCount);
  expect(errors).toEqual([]);
});

test("una toma anotada se guarda aunque se recargue antes de que termine la ventana de deshacer", async ({ page }) => {
  await page.goto("/app");
  const pillbox = page.locator("section#pastillero");
  await pillbox.getByRole("button", { name: "Ya me la tomé" }).first().click();
  await expect(pillbox.getByText("✓ Anotada")).toHaveCount(1);

  await page.reload();
  await expect(pillbox.getByText("✓ Tomada", { exact: true })).toHaveCount(1);
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
