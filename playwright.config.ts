import { defineConfig, devices } from "@playwright/test";

// E2E_PORT permite esquivar otro servidor local que ya ocupe el 3100 (reuseExistingServer lo reutilizaría).
const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://localhost:${PORT}`;

/**
 * Las pruebas de flujos diarios parten con el primer arranque ya hecho (como
 * un paciente que volvió). e2e/onboarding.spec.ts lo prueba desde cero.
 */
const RETURNING_PATIENT_STATE = {
  cookies: [],
  origins: [
    {
      origin: BASE_URL,
      localStorage: [
        {
          name: "artikare_onboarding_v1",
          value: JSON.stringify({ version: 1, startedAt: null, completedAt: "2026-10-01T13:00:00.000Z", intensity: "normal" }),
        },
      ],
    },
  ],
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    storageState: RETURNING_PATIENT_STATE,
    timezoneId: "America/Lima",
    locale: "es-PE",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile-375",
      use: { ...devices["iPhone SE"], browserName: "chromium", viewport: { width: 375, height: 667 } },
    },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
