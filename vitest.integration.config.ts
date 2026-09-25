import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Suite contra el Supabase local (`supabase start`); no corre en `npm test`
// porque necesita Docker. Se ejecuta con `npm run test:db`.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    env: { TZ: "UTC" },
    include: ["supabase/tests/integration/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
