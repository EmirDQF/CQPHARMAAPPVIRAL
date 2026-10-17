/**
 * Lógica pura de `npm run release:package` (scripts/package-release.mjs): nombres
 * de los artefactos, lectura de `aapt dump badging` y el LEEME de la carpeta de
 * entrega. Todo se deriva de la versión de package.json, nunca de un número a mano.
 */
import { ANDROID_APP_ID } from "../native/appIdentity.ts";
import { versionCodeFor } from "../version/appVersion.ts";

const REPOSITORY_URL = "https://github.com/EmirDQF/CQPHARMAAPPVIRAL";

export interface ReleaseFileNames {
  folder: string;
  apk: string;
  sha256: string;
  notes: string;
  readme: string;
  tag: string;
  releaseUrl: string;
}

export function releaseFileNames(version: string): ReleaseFileNames {
  const tag = `v${version}`;
  const apk = `artikare-${tag}-debug.apk`;
  return {
    folder: tag,
    apk,
    sha256: `${apk}.sha256`,
    notes: `RELEASE-NOTES-${tag}.md`,
    readme: `LEEME-${tag}.txt`,
    tag,
    releaseUrl: `${REPOSITORY_URL}/releases/tag/${tag}`,
  };
}

export interface ApkBadging {
  packageName: string;
  versionName: string;
  versionCode: number;
  minSdk: number;
  targetSdk: number;
}

function badgingField(text: string, pattern: RegExp): string {
  const match = pattern.exec(text);
  if (!match) throw new Error(`La salida de aapt no trae ${pattern.source}`);
  return match[1];
}

export function parseBadging(text: string): ApkBadging {
  return {
    packageName: badgingField(text, /^package: name='([^']+)'/m),
    versionName: badgingField(text, /versionName='([^']*)'/),
    versionCode: Number(badgingField(text, /versionCode='(\d+)'/)),
    minSdk: Number(badgingField(text, /^sdkVersion:'(\d+)'/m)),
    targetSdk: Number(badgingField(text, /^targetSdkVersion:'(\d+)'/m)),
  };
}

export function findApkIssues(badging: ApkBadging, version: string): string[] {
  const expectedCode = versionCodeFor(version);
  return [
    ...(badging.packageName === ANDROID_APP_ID ? [] : [`paquete ${badging.packageName} ≠ ${ANDROID_APP_ID}`]),
    ...(badging.versionName === version ? [] : [`versionName ${badging.versionName} ≠ package.json ${version}`]),
    ...(badging.versionCode === expectedCode ? [] : [`versionCode ${badging.versionCode} ≠ ${expectedCode}`]),
  ];
}

const ANDROID_RELEASES: Readonly<Record<number, string>> = {
  23: "6.0", 24: "7.0", 25: "7.1", 26: "8.0", 27: "8.1", 28: "9", 29: "10", 30: "11",
  31: "12", 32: "12L", 33: "13", 34: "14", 35: "15", 36: "16",
};

export function androidVersionForSdk(sdk: number): string {
  const release = ANDROID_RELEASES[sdk];
  return release ? `Android ${release}` : `API ${sdk}`;
}

/** Fecha AAAA-MM-DD en America/Lima (regla del proyecto para fechas diarias). */
export function limaDate(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(now);
}

interface ReadmeInput {
  version: string;
  versionCode: number;
  minSdk: number;
  date: string;
  sha256: string;
}

export function buildReadme({ version, versionCode, minSdk, date, sha256 }: ReadmeInput): string {
  const names = releaseFileNames(version);
  return [
    "ARTIKARE — app para Android",
    "",
    `VERSIÓN: ${version} (build ${versionCode})`,
    `Fecha: ${date} (hora de Lima)`,
    "Tipo: versión de PRUEBAS (APK de depuración, firmado con la clave debug). NO sirve para Google Play.",
    `Android mínimo: ${androidVersionForSdk(minSdk)} (minSdk ${minSdk})`,
    `Archivo: ${names.apk}`,
    "",
    "AVISOS",
    "- Contenido médico pendiente de validación del médico del proyecto; compártelo solo con personas de confianza.",
    "- Compilado en modo invitado: el respaldo y las cuentas aún no conectan. Todo lo demás funciona sin internet.",
    "",
    "INSTALAR EN EL CELULAR",
    "1. Copia el .apk al celular y ábrelo desde el gestor de archivos o el navegador.",
    "2. Si lo pide: Ajustes → Seguridad → Instalar apps desconocidas → permite esa app.",
    "3. Play Protect puede avisar que la app es desconocida: es lo esperado en una versión de pruebas.",
    "",
    "INSTALAR POR USB (con depuración USB activada)",
    `   adb install -r ${names.apk}`,
    "",
    "VERIFICAR QUE EL ARCHIVO ESTÁ ÍNTEGRO (PowerShell, en esta carpeta)",
    `   Get-FileHash -Algorithm SHA256 .\\${names.apk}`,
    `   Debe dar: ${sha256}`,
    "   Si no coincide, no lo instales.",
    "",
    "VER LA VERSIÓN EN LA APP",
    `   Ajustes → Acerca de → "Artikare v${version} (build ${versionCode})"`,
    "",
    `Release en GitHub: ${names.releaseUrl}`,
    "",
  ].join("\r\n");
}
