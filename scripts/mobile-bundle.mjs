// npm run mobile:bundle [-- --install] [-- --guest-only]
// APK debug con la interfaz DENTRO (CAP_MODE=bundled): abre sin servidor ni PC.
// build:mobile-web → cap sync → gradle assembleDebug → (opcional) adb install.
// Necesita NEXT_PUBLIC_API_BASE_URL (https público). Con --guest-only se usa un
// dominio reservado inexistente (.invalid, RFC 2606): la app funciona como
// invitado y la sincronización simplemente no conecta. Solo para pruebas.
import { join } from "node:path";
import { ANDROID_APP_ID } from "../src/lib/native/appIdentity.ts";
import { DEBUG_APK, NODE_TS_FLAGS, androidEnv, fail, gradle, requireDevice, run, step, syncCapacitor } from "./lib/mobile.mjs";

const GUEST_ONLY_API_BASE = "https://sin-servidor.invalid";

try {
  const guestOnly = process.argv.includes("--guest-only");
  const env = androidEnv({
    CAP_MODE: "bundled",
    ...(guestOnly ? { NEXT_PUBLIC_API_BASE_URL: GUEST_ONLY_API_BASE } : {}),
  });
  if (guestOnly) process.stdout.write("Modo --guest-only: sin API real; el respaldo y las cuentas no conectarán.\n");

  step("Interfaz empaquetable (build:mobile-web)");
  run("node", [...NODE_TS_FLAGS, join("scripts", "build-mobile-web.mjs")], { env });
  step("cap sync android (CAP_MODE=bundled)");
  syncCapacitor(env);
  step("gradle assembleDebug");
  gradle(env, "assembleDebug");
  process.stdout.write(`\nAPK: ${DEBUG_APK}\n`);

  if (process.argv.includes("--install")) {
    const serial = requireDevice(env);
    step("adb install -r");
    run("adb", ["-s", serial, "install", "-r", DEBUG_APK], { env });
    step("Abrir la app");
    run("adb", ["-s", serial, "shell", "monkey", "-p", ANDROID_APP_ID, "-c", "android.intent.category.LAUNCHER", "1"], {
      env,
      capture: true,
    });
    process.stdout.write(`Instalada y abierta (${ANDROID_APP_ID}).\n`);
  } else {
    process.stdout.write("Cópialo al teléfono (o usa --install con el teléfono por USB).\n");
  }
} catch (error) {
  fail(error);
}
