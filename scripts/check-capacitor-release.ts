// Valida que el entorno actual produciría un capacitor.config de release válido
// (CAP_SERVER_URL https con dominio público). Imprime el motivo, nunca la URL.
import { resolveCapacitorServer } from "../src/lib/env/capacitorEnv.ts";

try {
  resolveCapacitorServer({ ...process.env, CAP_ENV: "release" });
  process.stdout.write("check-capacitor-release: OK\n");
} catch (error) {
  process.stderr.write(`check-capacitor-release: ${error instanceof Error ? error.message : "error"}\n`);
  process.exit(1);
}
