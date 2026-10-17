// npm run verify:version [-- --built]: falla si package.json, android/app/build.gradle
// y capacitor.config.ts no comparten una única versión. Con --built contrasta además
// el output-metadata.json del APK debug compilado (lo que Gradle calculó de verdad).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { findVersionIssues, versionCodeFor } from "../src/lib/version/appVersion.ts";

const APK_METADATA = join("android", "app", "build", "outputs", "apk", "debug", "output-metadata.json");

function readBuiltApk() {
  if (!existsSync(APK_METADATA)) {
    process.stderr.write(`error: --built sin ${APK_METADATA}; compila antes con npm run mobile:bundle.\n`);
    process.exit(1);
  }
  const [element] = JSON.parse(readFileSync(APK_METADATA, "utf8")).elements ?? [];
  return { versionName: String(element?.versionName), versionCode: Number(element?.versionCode) };
}

const packageVersion = JSON.parse(readFileSync("package.json", "utf8")).version;
const issues = findVersionIssues({
  packageVersion,
  buildGradle: readFileSync(join("android", "app", "build.gradle"), "utf8"),
  capacitorConfig: readFileSync("capacitor.config.ts", "utf8"),
  builtApk: process.argv.includes("--built") ? readBuiltApk() : undefined,
});

if (issues.length > 0) {
  issues.forEach((issue) => process.stderr.write(`error: ${issue}\n`));
  process.stderr.write(`verify-version: ${issues.length} problema(s).\n`);
  process.exit(1);
}
process.stdout.write(`verify-version: OK · v${packageVersion} · versionCode ${versionCodeFor(packageVersion)}\n`);
