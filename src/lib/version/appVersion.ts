/**
 * Versión única de la app: `package.json` es la fuente de verdad. Gradle la
 * lee y calcula el código con la misma fórmula (android/app/build.gradle),
 * next.config.ts la inyecta como NEXT_PUBLIC_APP_VERSION/NEXT_PUBLIC_APP_BUILD
 * y scripts/verify-version.mjs comprueba que nadie la duplique a mano.
 */
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;
const MAX_MINOR_OR_PATCH = 99;

export interface AppVersion {
  major: number;
  minor: number;
  patch: number;
}

export function parseAppVersion(version: string): AppVersion {
  const match = SEMVER.exec(version.trim());
  if (!match) throw new Error(`Versión "${version}" no es SemVer X.Y.Z (sin sufijos).`);
  const [major, minor, patch] = match.slice(1).map(Number);
  if (minor > MAX_MINOR_OR_PATCH || patch > MAX_MINOR_OR_PATCH) {
    throw new Error(`Versión "${version}": minor y patch deben ser <= 99 para que versionCode sea monótono.`);
  }
  return { major, minor, patch };
}

/** versionCode de Android: major*10000 + minor*100 + patch (crece con cada versión). */
export function versionCodeFor(version: string): number {
  const { major, minor, patch } = parseAppVersion(version);
  return major * 10000 + minor * 100 + patch;
}

/** Texto de "Acerca de". Sin versión inyectada no inventa números. */
export function formatAppVersionLabel(version: string | undefined, build: string | undefined): string {
  if (!version || !build) return "Artikare (versión de desarrollo)";
  return `Artikare v${version} (build ${build})`;
}

interface VersionSources {
  packageVersion: string;
  buildGradle: string;
  capacitorConfig: string;
  /** output-metadata.json del APK compilado, si se quiere contrastar. */
  builtApk?: { versionName: string; versionCode: number };
}

const GRADLE_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/rootProject\.file\("\.\.\/package\.json"\)/, "build.gradle no lee la versión desde package.json"],
  [/major \* 10000 \+ minor \* 100 \+ patch/, "build.gradle no calcula el código con major*10000 + minor*100 + patch"],
  [/^\s*versionCode appVersionCode\s*$/m, "build.gradle: versionCode debe ser appVersionCode (no un número a mano)"],
  [/^\s*versionName appVersionName\s*$/m, "build.gradle: versionName debe ser appVersionName (no un texto a mano)"],
];

export function findVersionIssues({ packageVersion, buildGradle, capacitorConfig, builtApk }: VersionSources): string[] {
  let expectedCode: number;
  try {
    expectedCode = versionCodeFor(packageVersion);
  } catch (error) {
    return [`package.json: ${(error as Error).message}`];
  }
  const gradleIssues = GRADLE_RULES.filter(([pattern]) => !pattern.test(buildGradle)).map(([, message]) => message);
  const capacitorIssues = /\bversion(Name|Code)?\s*:/.test(capacitorConfig)
    ? ["capacitor.config.ts declara una versión propia: la única fuente es package.json"]
    : [];
  const apkIssues = builtApk
    ? [
        ...(builtApk.versionName === packageVersion
          ? []
          : [`APK compilado: versionName "${builtApk.versionName}" ≠ package.json "${packageVersion}"`]),
        ...(builtApk.versionCode === expectedCode
          ? []
          : [`APK compilado: versionCode ${builtApk.versionCode} ≠ ${expectedCode}`]),
      ]
    : [];
  return [...gradleIssues, ...capacitorIssues, ...apkIssues];
}
