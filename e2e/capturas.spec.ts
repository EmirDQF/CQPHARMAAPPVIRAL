/**
 * Capturas de revisión visual (no es una prueba del candado): pantallas clave en
 * 3 tamaños de letra y en modo oscuro. Uso:
 *   CAPTURAS=1 npx playwright test e2e/capturas.spec.ts --project=mobile-375
 * Las imágenes quedan en test-results/capturas (ignorado por git).
 */
import { test, type Page } from "@playwright/test";

const SIZES = ["normal", "large", "xlarge"] as const;

const PROFILE = {
  name: "Rosa",
  age: 63,
  sex: "femenino",
  weightKg: null,
  hasFractureHistory: false,
  menopausalStatus: "posmenopausica",
  allergies: "",
  phone: "",
  consent: { consentAt: "2026-10-01T13:00:00.000Z", consentVersion: "2026-10-10-provisional" },
};
const ONBOARDED = { version: 1, startedAt: null, completedAt: "2026-10-01T13:00:00.000Z", intensity: "normal", profileOfferSnoozedAt: null };

async function seed(page: Page, size: (typeof SIZES)[number], withProfile: boolean) {
  await page.addInitScript(
    ({ size, profile, onboarded, withProfile }) => {
      window.localStorage.setItem("artikare_text_size_v1", JSON.stringify({ version: 1, size }));
      if (withProfile) {
        window.localStorage.setItem("artikare_patient_profile_v1", JSON.stringify(profile));
        window.localStorage.setItem("artikare_onboarding_v1", JSON.stringify(onboarded));
      }
    },
    { size, profile: PROFILE, onboarded: ONBOARDED, withProfile }
  );
}

const SCREENS: readonly { name: string; path: string; withProfile: boolean; tab?: string }[] = [
  { name: "landing", path: "/", withProfile: false },
  { name: "test", path: "/test", withProfile: false },
  { name: "onboarding", path: "/app", withProfile: false },
  { name: "hoy", path: "/app", withProfile: true },
  { name: "mi-salud", path: "/app", withProfile: true, tab: "Mi salud" },
  { name: "aprender", path: "/app", withProfile: true, tab: "Aprender" },
  { name: "logros", path: "/app", withProfile: true, tab: "Jugar" },
  { name: "ajustes", path: "/app/ajustes", withProfile: true },
  { name: "citas", path: "/citas", withProfile: true },
  { name: "blog", path: "/blog", withProfile: false },
  { name: "privacidad", path: "/privacidad", withProfile: false },
];

test.describe("capturas de revisión", () => {
  test.skip(!process.env.CAPTURAS, "solo con CAPTURAS=1");
  test.use({ storageState: { cookies: [], origins: [] }, viewport: { width: 390, height: 844 } });

  for (const scheme of ["light", "dark"] as const) {
    for (const size of SIZES) {
      if (scheme === "dark" && size !== "normal") continue;
      test(`${scheme} · letra ${size}`, async ({ page }) => {
        test.setTimeout(180_000);
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
        for (const screen of SCREENS) {
          await page.context().clearCookies();
          await seed(page, size, screen.withProfile);
          await page.goto(screen.path);
          if (screen.name === "onboarding") {
            await page.getByRole("button", { name: /Toca para continuar/ }).click();
          }
          if (screen.tab) await page.getByRole("button", { name: screen.tab, exact: true }).click();
          await page.waitForTimeout(400);
          await page.screenshot({ path: `test-results/capturas/${scheme}-${size}-${screen.name}.png`, fullPage: false });
        }
      });
    }
  }
});
