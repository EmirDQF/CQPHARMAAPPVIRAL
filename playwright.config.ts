import { defineConfig, devices } from "@playwright/test";

// E2E_PORT permite esquivar otro servidor local que ya ocupe el 3100 (reuseExistingServer lo reutilizaría).
const PORT = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
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
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
