// npm run build:mobile-web — export estático de la interfaz para empaquetarla en el
// APK (CAP_MODE=bundled). next build con BUILD_TARGET=mobile (output: "export")
// no admite rutas de servidor, así que aparta api/, proxy y los metadatos de
// servidor durante el build y los devuelve SIEMPRE al terminar (también si falla
// o se interrumpe). Requiere NEXT_PUBLIC_API_BASE_URL (https público). Solo
// imprime nombres de variables, nunca valores.
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";
import { BUNDLED_WEB_DIR, resolveBundledApiBase } from "../src/lib/env/capacitorEnv.ts";
import { fail, run, step } from "./lib/mobile.mjs";

const STASH_DIR = ".mobile-stash";
/** Solo existen en el servidor: la app empaquetada no los usa. /test es un redirect de servidor (los enlaces /test abren "/"). */
const SERVER_ONLY = [
  join("src", "app", "api"),
  join("src", "app", ".well-known"),
  join("src", "app", "test"),
  join("src", "app", "opengraph-image.tsx"),
  join("src", "app", "twitter-image.tsx"),
  join("src", "app", "robots.ts"),
  join("src", "app", "sitemap.ts"),
  join("src", "proxy.ts"),
];
const PUBLIC_ENV_HINTS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SITE_URL"];
const REQUIRED_PAGES = ["index.html", join("app", "index.html"), join("app", "ajustes", "index.html")];

const stashPathOf = (path) => join(STASH_DIR, path.replaceAll("\\", "__").replaceAll("/", "__"));

function restoreStash() {
  if (!existsSync(STASH_DIR)) return;
  SERVER_ONLY.filter((path) => existsSync(stashPathOf(path))).forEach((path) => renameSync(stashPathOf(path), path));
  if (readdirSync(STASH_DIR).length === 0) rmSync(STASH_DIR, { recursive: true });
}

function stashServerOnly() {
  mkdirSync(STASH_DIR, { recursive: true });
  SERVER_ONLY.filter((path) => existsSync(path)).forEach((path) => renameSync(path, stashPathOf(path)));
}

let stashed = false;
const restoreOnce = () => {
  if (!stashed) return;
  stashed = false;
  restoreStash();
};
["SIGINT", "SIGTERM"].forEach((signal) =>
  process.on(signal, () => {
    restoreOnce();
    process.exit(130);
  })
);

try {
  const apiBase = resolveBundledApiBase(process.env);
  const missing = PUBLIC_ENV_HINTS.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) {
    process.stdout.write(`Aviso: sin ${missing.join(", ")} la app empaquetada funciona solo como invitado.\n`);
  }

  restoreStash(); // por si un build anterior se interrumpió a medias
  rmSync(BUNDLED_WEB_DIR, { recursive: true, force: true });
  step("Apartar archivos de servidor");
  stashServerOnly();
  stashed = true;
  step("next build (BUILD_TARGET=mobile, export estático)");
  run("npx", ["next", "build"], {
    env: { ...process.env, BUILD_TARGET: "mobile", CAP_MODE: "bundled", NEXT_PUBLIC_API_BASE_URL: apiBase },
  });
  restoreOnce();

  const missingPages = REQUIRED_PAGES.filter((page) => !existsSync(join(BUNDLED_WEB_DIR, page)));
  if (missingPages.length > 0) throw new Error(`El export no generó: ${missingPages.join(", ")}`);
  process.stdout.write(`\nInterfaz empaquetable en ${BUNDLED_WEB_DIR}/ (API: ${new URL(apiBase).host})\n`);
} catch (error) {
  restoreOnce();
  fail(error);
}
