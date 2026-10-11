import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Salida de Gradle y del cap sync (generada, ignorada por git).
    "android/**/build/**",
    "android/app/src/main/assets/**",
    // Shell offline generado por scripts/build-shell.mjs (fuente: capacitor-shell-src/).
    "capacitor-shell/**",
  ]),
]);

export default eslintConfig;
