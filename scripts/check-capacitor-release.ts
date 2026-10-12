// Valida que el entorno actual produciría un capacitor.config de release válido:
// remote = CAP_SERVER_URL https con dominio público; bundled = NEXT_PUBLIC_API_BASE_URL
// https público (la interfaz va dentro del APK). Imprime el motivo, nunca la URL.
import { resolveBundledApiBase, resolveCapMode, resolveCapacitorServer } from "../src/lib/env/capacitorEnv.ts";

try {
  if (resolveCapMode(process.env) === "bundled") resolveBundledApiBase(process.env);
  else resolveCapacitorServer({ ...process.env, CAP_ENV: "release" });
  process.stdout.write("check-capacitor-release: OK\n");
} catch (error) {
  process.stderr.write(`check-capacitor-release: ${error instanceof Error ? error.message : "error"}\n`);
  process.exit(1);
}
