// npm run build:android — AAB de release. Fuerza CAP_ENV=release (ignora el de
// la terminal), re-sincroniza y aborta si lo horneado conserva restos de dev
// (localhost, http://, cleartext). La firma la exige scripts/gradle.mjs.
import { join } from "node:path";
import { NODE_TS_FLAGS, androidEnv, fail, gradle, run, step, syncCapacitor } from "./lib/mobile.mjs";

try {
  step("mobile:verify");
  run("node", [...NODE_TS_FLAGS, join("scripts", "mobile-verify.mjs")]);
  step("next build");
  run("npx", ["next", "build"]);
  const env = androidEnv({ CAP_ENV: "release" });
  step("cap sync android (CAP_ENV=release)");
  syncCapacitor(env);
  step("Guardia anti-contaminación (config horneado)");
  run("node", [...NODE_TS_FLAGS, join("scripts", "verify-android-release.ts"), "--generated"], { env });
  step("gradle bundleRelease");
  gradle(env, "bundleRelease");
  process.stdout.write("\nAAB: android/app/build/outputs/bundle/release/app-release.aab\n");
} catch (error) {
  fail(error);
}
