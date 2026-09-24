import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // La lógica pura corre en node (arranque inmediato); los tests de
    // componentes activan jsdom con el docblock `@vitest-environment jsdom`.
    environment: "node",
    // Las fechas clínicas se calculan en America/Lima; el TZ del proceso se
    // fija en UTC para que los tests prueben esa conversión y no dependan
    // de la zona horaria de la máquina que los ejecuta.
    env: { TZ: "UTC" },
    setupFiles: ["./src/test/setup.ts", "./src/test/setupDom.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
