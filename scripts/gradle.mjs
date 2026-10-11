// Ejecuta el wrapper de Gradle de android/ en cualquier sistema (gradlew.bat en
// Windows). Para bundleRelease exige antes la firma del usuario
// (android/keystore.properties o ANDROID_KEYSTORE_*): sin ella falla con un
// mensaje claro y nunca genera un keystore. Uso: node scripts/gradle.mjs bundleRelease
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { findMissingSigningSettings, parseProperties } from "../src/lib/env/androidSigning.ts";

const ANDROID_DIR = "android";
const KEYSTORE_PROPERTIES = join(ANDROID_DIR, "keystore.properties");
const RELEASE_TASKS = new Set(["bundleRelease", "assembleRelease"]);

// Solo nombres de tarea simples: en Windows Gradle corre vía cmd.exe (shell) y un
// argumento con & | ^ % se interpretaría como comando.
const TASK_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9:]*$/;

const tasks = process.argv.slice(2);
if (tasks.length === 0 || !tasks.every((task) => TASK_NAME_PATTERN.test(task))) {
  process.stderr.write("Uso: node scripts/gradle.mjs <tarea> (p. ej. bundleRelease); solo letras, números y ':'.\n");
  process.exit(1);
}

if (tasks.some((task) => RELEASE_TASKS.has(task))) {
  const properties = existsSync(KEYSTORE_PROPERTIES) ? parseProperties(readFileSync(KEYSTORE_PROPERTIES, "utf8")) : {};
  // storeFile en keystore.properties es relativo a android/app (como lo resuelve Gradle).
  const resolveStoreFile = (path) => (isAbsolute(path) ? path : resolve(ANDROID_DIR, "app", path));
  const missing = findMissingSigningSettings(properties, process.env, (path) => existsSync(resolveStoreFile(path)));
  if (missing.length > 0) {
    process.stderr.write(
      [
        "No se puede firmar el release: falta la configuración del keystore del usuario.",
        ...missing.map((item) => `  - ${item}`),
        `Crea ${KEYSTORE_PROPERTIES} (ignorado por git) o define las variables ANDROID_KEYSTORE_*.`,
        "",
      ].join("\n")
    );
    process.exit(1);
  }
}

// Ruta absoluta: cmd.exe no busca en el directorio actual si
// NoDefaultCurrentDirectoryInExePath está activo. Entre comillas por si hay espacios.
const isWindows = process.platform === "win32";
const wrapperPath = resolve(ANDROID_DIR, isWindows ? "gradlew.bat" : "gradlew");
const wrapper = isWindows ? `"${wrapperPath}"` : wrapperPath;
// En Windows, una sola línea (DEP0190); las tareas ya pasaron TASK_NAME_PATTERN.
const [command, args] = isWindows ? [[wrapper, ...tasks].join(" "), []] : [wrapper, tasks];
const result = spawnSync(command, args, { cwd: ANDROID_DIR, stdio: "inherit", shell: isWindows });
if (result.error) {
  process.stderr.write(`No se pudo ejecutar Gradle: ${result.error.message}\n`);
  process.exit(1);
}
process.exit(result.status ?? 1);
