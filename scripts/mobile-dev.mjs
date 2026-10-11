// npm run mobile:dev — desarrollo en el teléfono por USB con hot reload:
// 1) exige un dispositivo, 2) adb reverse tcp:3000 (el teléfono ve la PC como
// localhost), 3) cap sync con CAP_ENV=dev, 4) next dev en 127.0.0.1:3000.
// Se escucha solo en loopback: adb reverse no necesita exponer el servidor a la red.
import { spawn } from "node:child_process";
import { DEV_PORT, androidEnv, commandLine, fail, requireDevice, reversePort, step, syncCapacitor } from "./lib/mobile.mjs";

try {
  const env = androidEnv({ CAP_ENV: "dev" });
  step("Dispositivo (adb devices)");
  const serial = requireDevice(env);
  step(`adb reverse tcp:${DEV_PORT}`);
  reversePort(env, serial);
  step("cap sync android (CAP_ENV=dev)");
  syncCapacitor(env);
  process.stdout.write(
    [
      "",
      "Listo. Si la app aún no está instalada o cambió algo nativo, en otra terminal:",
      "  npm run mobile:install",
      `Los cambios web se recargan solos. Servidor: http://localhost:${DEV_PORT}`,
      "",
    ].join("\n")
  );
  step("next dev");
  const server = spawn(...commandLine("npx", ["next", "dev", "-H", "127.0.0.1", "-p", DEV_PORT]), {
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  server.on("error", fail);
  server.on("exit", (code) => process.exit(code ?? 0));
} catch (error) {
  fail(error);
}
