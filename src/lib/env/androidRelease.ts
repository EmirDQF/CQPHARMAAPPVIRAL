import { z } from "zod";
import { isLocalHost } from "./capacitorEnv.ts";

/**
 * Guardias del release Android (sin I/O: los scripts leen los archivos).
 * - Fuentes de `main`: ni usesCleartextTraffic ni excepciones de cleartext; el
 *   network_security_config estricto debe estar conectado. La variante debug
 *   lo sobreescribe (src/debug/res/xml) solo para loopback.
 * - Archivos generados por `cap sync`: el capacitor.config.json horneado y el
 *   manifest de plugins no deben traer restos de un sync en modo dev.
 * Imports relativos con extensión .ts: también lo ejecuta Node sin bundler.
 */
export const NETWORK_CONFIG_FILE = "network_security_config.xml";
const NETWORK_CONFIG_REF = 'android:networkSecurityConfig="@xml/network_security_config"';
const USES_CLEARTEXT = /usesCleartextTraffic\s*=\s*"true"/;
const CLEARTEXT_PERMITTED = /cleartextTrafficPermitted\s*=\s*"true"/;
const STRICT_BASE_CONFIG = /<base-config[^>]*cleartextTrafficPermitted\s*=\s*"false"/;

export interface ReleaseSources {
  manifest: string;
  xmlFiles: Readonly<Record<string, string>>;
}

export function findReleaseSourceIssues({ manifest, xmlFiles }: ReleaseSources): string[] {
  const cleartextXml = Object.entries(xmlFiles)
    .filter(([, content]) => CLEARTEXT_PERMITTED.test(content))
    .map(([name]) => `${name} (main) permite cleartext`);
  const networkConfig = xmlFiles[NETWORK_CONFIG_FILE];
  return [
    ...(USES_CLEARTEXT.test(manifest) ? ["AndroidManifest.xml (main) declara usesCleartextTraffic"] : []),
    ...cleartextXml,
    ...(manifest.includes(NETWORK_CONFIG_REF)
      ? []
      : ["AndroidManifest.xml (main) no referencia @xml/network_security_config"]),
    ...(networkConfig !== undefined && STRICT_BASE_CONFIG.test(networkConfig)
      ? []
      : [`${NETWORK_CONFIG_FILE} (main) no existe o no niega cleartext en base-config`]),
  ];
}

const generatedConfigSchema = z.object({
  // Sin `server.url` = app empaquetada (bundled): la interfaz va dentro del APK.
  server: z
    .object({ url: z.string().optional(), cleartext: z.boolean().optional(), androidScheme: z.string().optional() })
    .optional(),
  android: z.object({ allowMixedContent: z.boolean().optional() }).optional(),
});

function parseGeneratedConfig(raw: string | null): z.infer<typeof generatedConfigSchema> | null {
  if (raw === null) return null;
  try {
    const parsed = generatedConfigSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Empaquetada: sin servidor remoto no hay URL que revisar, solo que no se admita contenido mixto. */
function findBundledIssues(config: z.infer<typeof generatedConfigSchema>): string[] {
  return [
    ...(config.android?.allowMixedContent === true ? ["capacitor.config.json: allowMixedContent activado"] : []),
    ...(config.server?.cleartext === true ? ["capacitor.config.json: cleartext activado"] : []),
    ...(config.server?.androidScheme !== undefined && config.server.androidScheme !== "https"
      ? ["capacitor.config.json: androidScheme no es https"]
      : []),
  ];
}

function findServerIssues(raw: string, server: { url: string; cleartext?: boolean }): string[] {
  const url = URL.canParse(server.url) ? new URL(server.url) : null;
  const isLocal = raw.includes("localhost") || (url !== null && isLocalHost(url.hostname));
  return [
    ...(url?.protocol === "https:" ? [] : ["capacitor.config.json: server.url no es https"]),
    ...(isLocal ? ["capacitor.config.json: contiene localhost o un host local"] : []),
    ...(server.cleartext === true ? ["capacitor.config.json: cleartext activado"] : []),
  ];
}

export interface GeneratedConfig {
  capacitorConfigJson: string | null;
  pluginsManifest: string | null;
}

export function findGeneratedConfigIssues({ capacitorConfigJson, pluginsManifest }: GeneratedConfig): string[] {
  const config = parseGeneratedConfig(capacitorConfigJson);
  const configIssues =
    config === null || capacitorConfigJson === null
      ? ["capacitor.config.json: no existe o no es JSON válido (ejecuta cap sync)"]
      : config.server?.url !== undefined
        ? findServerIssues(capacitorConfigJson, { url: config.server.url, cleartext: config.server.cleartext })
        : findBundledIssues(config);
  const pluginIssues =
    pluginsManifest !== null && USES_CLEARTEXT.test(pluginsManifest)
      ? ["capacitor-cordova-android-plugins: AndroidManifest.xml declara usesCleartextTraffic"]
      : [];
  return [...configIssues, ...pluginIssues];
}
