import { expect, test } from "@playwright/test";

/**
 * Invitado primero (C2): sin variables de Supabase la app funciona igual que antes,
 * no invita a crear una cuenta que no puede existir y no llama a Supabase ni a Turnstile.
 */
const INVITE_TITLE = "No pierdas tus registros si cambias de celular";
const EXTERNAL_AUTH_HOSTS = /supabase\.co|127\.0\.0\.1:54321|challenges\.cloudflare\.com/;

test("sin Supabase: el panel, el reporte y /acceso funcionan como invitado", async ({ page }) => {
  const errors: string[] = [];
  const authRequests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("request", (request) => {
    if (EXTERNAL_AUTH_HOSTS.test(request.url())) authRequests.push(request.url());
  });

  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "¿Cómo amanecieron tus articulaciones hoy?" })).toBeVisible();
  await expect(page.getByText(INVITE_TITLE)).toHaveCount(0);

  await page.goto("/app/reporte-medico");
  await expect(page.getByRole("button", { name: /Imprimir/ })).toBeVisible();
  await expect(page.getByText(INVITE_TITLE)).toHaveCount(0);

  await page.goto("/acceso");
  await expect(page.getByRole("heading", { name: "Accede a tu cuenta" })).toBeVisible();
  await expect(page.getByText(/Tus registros siguen guardados en este celular/)).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);

  expect(authRequests).toEqual([]);
  expect(errors).toEqual([]);
});
