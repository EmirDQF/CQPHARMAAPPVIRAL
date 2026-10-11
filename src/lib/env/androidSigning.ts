/**
 * Firma del AAB de release. El keystore lo tiene SOLO el usuario: se lee de
 * android/keystore.properties (ignorado por git) o de variables de entorno.
 * Esta regla decide si se puede compilar; nunca crea ni inventa un keystore.
 * La misma correspondencia usa android/app/build.gradle.
 */
const SIGNING_SETTINGS = [
  { property: "storeFile", env: "ANDROID_KEYSTORE_PATH" },
  { property: "storePassword", env: "ANDROID_KEYSTORE_PASSWORD" },
  { property: "keyAlias", env: "ANDROID_KEY_ALIAS" },
  { property: "keyPassword", env: "ANDROID_KEY_PASSWORD" },
] as const;

export function parseProperties(text: string): Record<string, string> {
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      })
  );
}

/** Nombres (nunca valores) de lo que falta para firmar; [] = se puede firmar. */
export function findMissingSigningSettings(
  properties: Readonly<Record<string, string>>,
  env: Readonly<Record<string, string | undefined>>,
  fileExists: (path: string) => boolean
): string[] {
  const missing = SIGNING_SETTINGS.filter(
    ({ property, env: envName }) => !(properties[property] || env[envName])
  ).map(({ property, env: envName }) => `${property} (o ${envName})`);
  if (missing.length > 0) return missing;

  const storeFile = properties.storeFile || env.ANDROID_KEYSTORE_PATH || "";
  return fileExists(storeFile) ? [] : ["storeFile: el archivo del keystore no existe"];
}
