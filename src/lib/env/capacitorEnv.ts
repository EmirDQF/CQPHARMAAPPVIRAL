import { z } from "zod";

/**
 * Servidor que carga el WebView de Capacitor, según CAP_ENV (no NODE_ENV:
 * `cap sync` no lo fija). Lo que devuelve se hornea en el APK al sincronizar.
 * - dev: CAP_SERVER_URL o http://localhost:3000 (con `adb reverse tcp:3000
 *   tcp:3000`). El http solo se admite a loopback, igual que el
 *   network_security_config de la variante debug.
 * - release (o CAP_ENV sin definir): exige CAP_SERVER_URL https con dominio
 *   público. Sin fallback: fallar es mejor que empaquetar un dominio inventado.
 * Los errores nombran la variable, jamás su valor.
 * Sin alias `@/`: lo cargan capacitor.config.ts y scripts de Node sin bundler.
 */
export type EnvMap = Readonly<Record<string, string | undefined>>;

export const CAP_ENVS = ["dev", "release"] as const;
export type CapEnv = (typeof CAP_ENVS)[number];

export interface CapacitorServer {
  env: CapEnv;
  url: string;
  cleartext: boolean;
  allowMixedContent: false;
}

export const DEV_DEFAULT_SERVER_URL = "http://localhost:3000";

/** Hosts a los que la variante debug permite cleartext (network_security_config). */
export const DEV_CLEARTEXT_HOSTS: readonly string[] = ["localhost", "127.0.0.1", "10.0.2.2"];

const capEnvSchema = z.enum(CAP_ENVS);

/** localhost, *.local/*.internal o cualquier IP literal (un App Link exige dominio). */
const LOCAL_HOST_PATTERNS: readonly RegExp[] = [
  /^localhost$/i,
  /\.(localhost|local|internal|lan)$/i,
  /^\d{1,3}(\.\d{1,3}){3}$/,
  /^\[.*\]$/,
];

/** "localhost." (FQDN con punto final) resuelve igual que "localhost". */
export function isLocalHost(hostname: string): boolean {
  const normalized = hostname.replace(/\.$/, "");
  return LOCAL_HOST_PATTERNS.some((pattern) => pattern.test(normalized));
}

function parseCapEnv(raw: string | undefined): CapEnv {
  const value = raw?.trim() ? raw.trim() : "release";
  const parsed = capEnvSchema.safeParse(value);
  if (!parsed.success) throw new Error(`CAP_ENV debe ser ${CAP_ENVS.join(" o ")}`);
  return parsed.data;
}

function parseUrl(raw: string): URL {
  if (!URL.canParse(raw)) throw new Error("CAP_SERVER_URL no es una URL válida");
  const url = new URL(raw);
  if (url.username || url.password) throw new Error("CAP_SERVER_URL no debe llevar credenciales");
  return url;
}

function resolveDevUrl(raw: string | undefined): URL {
  const url = parseUrl(raw?.trim() ? raw.trim() : DEV_DEFAULT_SERVER_URL);
  if (url.protocol === "https:") return url;
  if (url.protocol === "http:" && DEV_CLEARTEXT_HOSTS.includes(url.hostname)) return url;
  throw new Error(`En dev, CAP_SERVER_URL http solo admite ${DEV_CLEARTEXT_HOSTS.join(", ")} (usa adb reverse)`);
}

function resolveReleaseUrl(raw: string | undefined): URL {
  if (!raw?.trim()) throw new Error("CAP_SERVER_URL falta: el release exige la URL https del despliegue");
  const url = parseUrl(raw.trim());
  if (url.protocol !== "https:") throw new Error("CAP_SERVER_URL debe usar https en release");
  if (isLocalHost(url.hostname)) {
    throw new Error("CAP_SERVER_URL apunta a un host local o IP en release; usa el dominio público");
  }
  return url;
}

export function resolveCapacitorServer(env: EnvMap): CapacitorServer {
  const capEnv = parseCapEnv(env.CAP_ENV);
  if (capEnv === "dev") {
    const url = resolveDevUrl(env.CAP_SERVER_URL);
    return { env: capEnv, url: url.href, cleartext: url.protocol === "http:", allowMixedContent: false };
  }
  const url = resolveReleaseUrl(env.CAP_SERVER_URL);
  return { env: capEnv, url: url.href, cleartext: false, allowMixedContent: false };
}
