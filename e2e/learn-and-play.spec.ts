import { expect, test, type Page } from "@playwright/test";

/** Superprompt: pack actualizado, menopausia con 4 opciones, Aprender, Jugar → XP → recompensa y bandera roja (375 px). */
const CONSENT = { consentAt: "2026-09-01T15:00:00.000Z", consentVersion: "2026-09-v1" };

async function seedProfile(page: Page, overrides: Record<string, unknown>, lumbarTScore?: number): Promise<void> {
  await page.addInitScript(
    ({ profile, tScore }) => {
      window.localStorage.setItem("artikare_patient_profile_v1", JSON.stringify(profile));
      if (tScore !== undefined) {
        window.localStorage.setItem(
          "artikare_dexa_vault_v1",
          JSON.stringify([{ id: "dexa-1", date: "2026-08-15", lumbarTScore: tScore, femoralNeckTScore: -1.2, radiologyCenter: "Centro de prueba" }])
        );
      }
    },
    {
      profile: { name: "Ana", age: 62, sex: "femenino", weightKg: null, hasFractureHistory: false, menopausalStatus: "posmenopausica", allergies: "", phone: "", consent: CONSENT, ...overrides },
      tScore: lumbarTScore,
    }
  );
}

async function openTab(page: Page, name: string): Promise<void> {
  await page.getByRole("navigation", { name: "Navegación principal" }).getByRole("button", { name }).click();
}

test("A1: la tarjeta del Pack Diagnóstico Óseo muestra vitamina D, DMO y la nueva indicación", async ({ page }) => {
  await page.goto("/");
  const card = page.locator("div.rounded-card", { has: page.getByRole("heading", { name: "Pack Diagnóstico Óseo" }) });
  await expect(card.getByText("Dosaje de vitamina D + DMO + asesoría nutricional")).toBeVisible();
  await expect(card.getByText("DMO (densitometría ósea)")).toBeVisible();
  await expect(card.getByText(/fractura de cadera o de vértebra en un familiar directo/)).toBeVisible();
  await expect(card.getByText(/T-Score|dolor lumbar/)).toHaveCount(0);
  await expect(card.getByRole("link", { name: /Reservar por WhatsApp/ }).or(card.getByText(/Reservar por WhatsApp/))).toBeVisible();
});

test.describe("A2: menopausia", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("ofrece cuatro respuestas en orden y 'No estoy segura' muestra un aviso amable", async ({ page }) => {
    await page.goto("/app");
    await page.getByRole("button", { name: /Toca para continuar/ }).click();
    await page.getByRole("button", { name: "Empezar" }).click();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Acepto y sigo" }).click();
    await page.getByLabel("¿Cómo te llamo?").fill("Ana");
    await page.getByRole("button", { name: "Siguiente" }).click();
    await page.getByLabel("¿Cuántos años tienes?").fill("52");
    await page.getByRole("button", { name: "Siguiente" }).click();
    await page.getByText("Femenino", { exact: true }).click();
    await page.getByRole("button", { name: "Siguiente" }).click();

    await expect(page.getByRole("heading", { name: "¿Ya pasaste la menopausia?" })).toBeVisible();
    await expect(page.getByText(/Paso \d+ de \d+/)).toBeVisible();
    await expect(page.getByRole("radio")).toHaveCount(4);
    for (const label of ["Sí, ya la pasé", "Aún no", "No estoy segura", "Prefiero no decirlo"]) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
    await page.getByText("No estoy segura", { exact: true }).click();
    await expect(page.getByText("Tu médico confirmará esto contigo.")).toBeVisible();
  });
});

test("Aprender: una lección con preguntas para el médico suma XP con recompensa", async ({ page }) => {
  await seedProfile(page, {});
  await page.goto("/app");
  await openTab(page, "Aprender");
  await page.getByRole("button", { name: /Gota: cuando el ácido úrico/ }).click();
  await page.getByRole("button", { name: /Preguntar a mi médico/ }).click();
  await expect(page.getByText("¿Debo medir mi ácido úrico?")).toBeVisible();
  await page.getByRole("button", { name: /Terminé la lección/ }).click();
  await expect(page.getByText("+10 XP")).toBeVisible();
  await page.getByRole("button", { name: "Seguir" }).click();
  await expect(page.getByText(/1 de \d+ lecciones leídas/)).toBeVisible();
});

test("Jugar: completar Mito o Realidad suma XP y muestra la recompensa", async ({ page }) => {
  await seedProfile(page, {});
  await page.goto("/app");
  await openTab(page, "Jugar");
  await page.getByRole("button", { name: /Mito o Realidad/ }).click();
  while ((await page.getByText(/Acertaste \d+ de \d+/).count()) === 0) {
    await page.getByRole("group", { name: "Opciones" }).getByRole("button").first().click();
    await page.getByRole("button", { name: /Siguiente|Ver resultado/ }).click();
  }
  await page.getByRole("button", { name: /Terminar y sumar XP/ }).click();
  await expect(page.getByText("+15 XP")).toBeVisible();
  await page.getByRole("button", { name: "Seguir" }).click();
  await expect(page.getByText(/Mejor: \d+\/\d+/)).toBeVisible();
});

test("bandera roja: la evaluación reumatológica va arriba y se ocultan juegos y lecciones de movimiento", async ({ page }) => {
  await seedProfile(page, { hasFractureHistory: true }, -2.8);
  await page.goto("/app");
  const banner = page.getByRole("heading", { name: /reumat/i }).first();
  await expect(banner).toBeVisible();

  await openTab(page, "Mi salud");
  await expect(page.getByRole("button", { name: "Agendar evaluación" })).toBeVisible();
  await openTab(page, "Jugar");
  await expect(page.getByText("Escudo Óseo del Día")).toHaveCount(0);
  await openTab(page, "Aprender");
  await expect(page.getByText("Ejercicio seguro para huesos y articulaciones")).toHaveCount(0);
});
