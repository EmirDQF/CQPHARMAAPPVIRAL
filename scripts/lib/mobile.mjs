// Utilidades de I/O de los scripts móviles (Windows, macOS y Linux). La lógica
// pura vive en src/lib/env/androidTooling.ts (con tests). Ningún paso imprime
// valores de variables de entorno.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { javaHomeCandidates, parseAdbDevices, pickDevice, readSdkDir } from "../../src/lib/env/androidTooling.ts";
import { resolveCapMode } from "../../src/lib/env/capacitorEnv.ts";

export const NODE_TS_FLAGS = ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON"];
export const DEV_PORT = "3000";
export const DEBUG_APK = join("android", "app", "build", "outputs", "apk", "debug", "app-debug.apk");

const IS_WINDOWS = process.platform === "win32";
const LOCAL_PROPERTIES = join("android", "local.properties");

/**
 * En Windows npx/.bat solo arrancan vía cmd.exe: se pasa una sola línea (Node
 * desaconseja args sueltos con shell, DEP0190). Los argumentos son constantes
 * de los scripts o rutas del repo, nunca texto del usuario.
 */
export function commandLine(command, args) {
  return IS_WINDOWS ? [[command, ...args].join(" "), []] : [command, args];
}

/** Ejecuta un comando heredando la salida; lanza si termina con error. */
export function run(command, args, { env = process.env, capture = false } = {}) {
  const result = spawnSync(...commandLine(command, args), {
    env,
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    shell: IS_WINDOWS,
    encoding: "utf8",
  });
  if (result.error) throw new Error(`No se pudo ejecutar ${command}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} terminó con código ${result.status}`);
  return capture ? result.stdout : "";
}

export function step(title) {
  process.stdout.write(`\n▶ ${title}\n`);
}

export function fail(error) {
  process.stderr.write(`\n✖ ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}

function findJavaHome() {
  const javaBinary = IS_WINDOWS ? "java.exe" : "java";
  return javaHomeCandidates(process.env, process.platform).find((home) => existsSync(join(home, "bin", javaBinary)));
}

/** Entorno con JAVA_HOME y ANDROID_HOME resueltos aunque la terminal no los tenga. */
export function androidEnv(overrides = {}) {
  const localProperties = existsSync(LOCAL_PROPERTIES) ? readFileSync(LOCAL_PROPERTIES, "utf8") : null;
  const sdkDir = readSdkDir(process.env, localProperties);
  const javaHome = findJavaHome();
  if (!javaHome) throw new Error("No se encontró un JDK: instala Android Studio o define JAVA_HOME");
  const pathKey = Object.keys(process.env).find((key) => key.toUpperCase() === "PATH") ?? "PATH";
  const extraPaths = [join(javaHome, "bin"), ...(sdkDir ? [join(sdkDir, "platform-tools")] : [])];
  return {
    ...process.env,
    JAVA_HOME: javaHome,
    ...(sdkDir ? { ANDROID_HOME: sdkDir } : {}),
    [pathKey]: [...extraPaths, process.env[pathKey] ?? ""].join(IS_WINDOWS ? ";" : ":"),
    ...overrides,
  };
}

/** Exige un teléfono en estado `device` y devuelve su serial. */
export function requireDevice(env) {
  const pick = pickDevice(parseAdbDevices(run("adb", ["devices"], { env, capture: true })), env.ANDROID_SERIAL);
  if ("error" in pick) throw new Error(pick.error);
  process.stdout.write(`Dispositivo: ${pick.serial}\n`);
  return pick.serial;
}

export function reversePort(env, serial) {
  run("adb", ["-s", serial, "reverse", `tcp:${DEV_PORT}`, `tcp:${DEV_PORT}`], { env });
}

/**
 * Sincroniza Capacitor con el proyecto Android. remote: hornea el servidor de
 * CAP_ENV (shell offline + cap sync). bundled: la interfaz ya está en out-mobile
 * (npm run build:mobile-web) y no hay servidor ni shell que generar.
 */
export function syncCapacitor(env) {
  if (resolveCapMode(env) === "bundled") {
    if (!existsSync("out-mobile")) throw new Error("Falta out-mobile/: corre npm run build:mobile-web antes");
  } else {
    run("node", [...NODE_TS_FLAGS, join("scripts", "build-shell.mjs")], { env });
  }
  run("npx", ["cap", "sync", "android"], { env });
}

export function gradle(env, task) {
  run("node", [...NODE_TS_FLAGS, join("scripts", "gradle.mjs"), task], { env });
}
