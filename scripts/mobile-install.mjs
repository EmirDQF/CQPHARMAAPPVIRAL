// npm run mobile:install — instala y abre el APK debug en el teléfono:
// cap sync (CAP_ENV=dev) → gradle assembleDebug → adb install -r → abrir la app.
// Requiere `npm run mobile:dev` corriendo para que la app cargue algo.
import { ANDROID_APP_ID } from "../src/lib/native/appIdentity.ts";
import { DEBUG_APK, androidEnv, fail, gradle, requireDevice, reversePort, run, step, syncCapacitor } from "./lib/mobile.mjs";

try {
  const env = androidEnv({ CAP_ENV: "dev" });
  step("Dispositivo (adb devices)");
  const serial = requireDevice(env);
  reversePort(env, serial);
  step("cap sync android (CAP_ENV=dev)");
  syncCapacitor(env);
  step("gradle assembleDebug");
  gradle(env, "assembleDebug");
  step("adb install -r");
  run("adb", ["-s", serial, "install", "-r", DEBUG_APK], { env });
  step("Abrir la app");
  run("adb", ["-s", serial, "shell", "monkey", "-p", ANDROID_APP_ID, "-c", "android.intent.category.LAUNCHER", "1"], {
    env,
    capture: true,
  });
  process.stdout.write(`\nInstalada y abierta (${ANDROID_APP_ID}). Para reinstalar: npm run mobile:install\n`);
} catch (error) {
  fail(error);
}
