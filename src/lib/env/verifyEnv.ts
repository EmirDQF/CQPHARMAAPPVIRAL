import { z } from "zod";
import { parseAndroidFingerprints } from "../native/assetLinks.ts";

/**
 * Verificación de variables de entorno antes de compilar (npm run verify-env).
 * Solo informa NOMBRES de variables, jamás valores. Sin --strict (desarrollo,
 * modo invitado) lo que falta es aviso; con --strict (release) es error. Un
 * secreto expuesto con prefijo NEXT_PUBLIC_ es error siempre.
 * Imports relativos con extensión .ts: este módulo también lo ejecuta Node
 * directamente (scripts/verify-env.ts) sin bundler.
 */
export type EnvMap = Readonly<Record<string, string | undefined>>;

export interface EnvReport {
  errors: string[];
  warnings: string[];
}

const httpsUrl = z.url({ protocol: /^https$/ });
const nonEmptyKey = z.string().trim().min(20);

const REQUIRED_FOR_RELEASE: Readonly<Record<string, (value: string) => boolean>> = {
  NEXT_PUBLIC_SUPABASE_URL: (value) => httpsUrl.safeParse(value).success,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: (value) => nonEmptyKey.safeParse(value).success,
  SUPABASE_SERVICE_ROLE_KEY: (value) => nonEmptyKey.safeParse(value).success,
  NEXT_PUBLIC_SITE_URL: (value) => httpsUrl.safeParse(value).success,
  ANDROID_SHA256_FINGERPRINT: (value) => parseAndroidFingerprints(value) !== null,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: (value) => value.trim().length > 0,
};

/**
 * Según CAP_MODE: remote carga un servidor (CAP_SERVER_URL); bundled lleva la
 * interfaz dentro del APK y solo necesita la API remota (NEXT_PUBLIC_API_BASE_URL).
 */
const REQUIRED_BY_CAP_MODE: Readonly<Record<"remote" | "bundled", Readonly<Record<string, (value: string) => boolean>>>> = {
  remote: { CAP_SERVER_URL: (value) => httpsUrl.safeParse(value).success },
  bundled: { NEXT_PUBLIC_API_BASE_URL: (value) => httpsUrl.safeParse(value).success },
};

/** Nombres que delatan un secreto; las claves públicas por diseño se excluyen. */
const SECRET_NAME_PATTERN = /SECRET|SERVICE_ROLE|PRIVATE|PASSWORD|TOKEN|API_KEY/;
const PUBLIC_BY_DESIGN = new Set(["NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_TURNSTILE_SITE_KEY"]);
const SERVER_SECRETS = ["SUPABASE_SERVICE_ROLE_KEY", "TURNSTILE_SECRET_KEY", "RESEND_API_KEY"] as const;

function findExposedSecrets(env: EnvMap): string[] {
  const publicNames = Object.keys(env).filter((name) => name.startsWith("NEXT_PUBLIC_"));
  const secretLookingNames = publicNames.filter(
    (name) => !PUBLIC_BY_DESIGN.has(name) && SECRET_NAME_PATTERN.test(name)
  );
  const secretValues = new Set(SERVER_SECRETS.flatMap((name) => (env[name] ? [env[name]] : [])));
  const leakedValueNames = publicNames.filter((name) => {
    const value = env[name];
    return value !== undefined && secretValues.has(value);
  });
  return [...new Set([...secretLookingNames, ...leakedValueNames])].map(
    (name) => `${name}: parece un secreto con prefijo NEXT_PUBLIC_ (se incrusta en el cliente)`
  );
}

function findInvalidRequired(env: EnvMap): string[] {
  const mode = env.CAP_MODE?.trim() === "bundled" ? "bundled" : "remote";
  return Object.entries({ ...REQUIRED_FOR_RELEASE, ...REQUIRED_BY_CAP_MODE[mode] }).flatMap(([name, isValid]) => {
    const value = env[name];
    if (value === undefined || value.trim() === "") return [`${name}: falta`];
    return isValid(value) ? [] : [`${name}: formato inválido`];
  });
}

export function verifyEnv(env: EnvMap, { strict }: { strict: boolean }): EnvReport {
  const exposed = findExposedSecrets(env);
  const invalid = findInvalidRequired(env);
  return strict ? { errors: [...exposed, ...invalid], warnings: [] } : { errors: exposed, warnings: invalid };
}
