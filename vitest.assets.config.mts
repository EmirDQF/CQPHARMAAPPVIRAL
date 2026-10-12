import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Solo para npm run generate:android-assets: exporta el SVG de Artiko con el mismo
// componente de la app (TSX y alias @/), sin correr la suite de tests.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["scripts/artiko/*.export.tsx"],
  },
});
