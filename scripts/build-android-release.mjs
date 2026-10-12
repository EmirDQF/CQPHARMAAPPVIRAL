// npm run build:android — AAB de release. Por defecto CAP_MODE=bundled: la
// interfaz va dentro del APK (build:mobile-web) y solo la API es remota
// (NEXT_PUBLIC_API_BASE_URL). Con CAP_MODE=remote carga el servidor de
// CAP_SERVER_URL como antes. Fuerza CAP_ENV=release (ignora el de la terminal),
// re-sincroniza y aborta si lo horneado conserva restos de dev (localhost,
// http://, cleartext). La firma la exige scripts/gradle.mjs.
import { join } from "node:path";
import { NODE_TS_FLAGS, androidEnv, fail, gradle, run, step, syncCapacitor } from "./lib/mobile.mjs";

process.env.CAP_MODE ||= "bundled";
const isBundled = process.env.CAP_MODE === "bundled";

try {
  step("mobile:verify");
  run("node", [...NODE_TS_FLAGS, join("scripts", "mobile-verify.mjs")]);
  if (isBundled) {
    step("build:mobile-web (interfaz dentro del APK)");
    run("node", [...NODE_TS_FLAGS, join("scripts", "build-mobile-web.mjs")]);
  } else {
    step("next build");
    run("npx", ["next", "build"]);
  }
  const env = androidEnv({ CAP_ENV: "release", CAP_MODE: process.env.CAP_MODE });
  step(`cap sync android (CAP_ENV=release, CAP_MODE=${process.env.CAP_MODE})`);
  syncCapacitor(env);
  step("Guardia anti-contaminación (config horneado)");
  run("node", [...NODE_TS_FLAGS, join("scripts", "verify-android-release.ts"), "--generated"], { env });
  step("gradle bundleRelease");
  gradle(env, "bundleRelease");
  process.stdout.write("\nAAB: android/app/build/outputs/bundle/release/app-release.aab\n");
} catch (error) {
  fail(error);
}
