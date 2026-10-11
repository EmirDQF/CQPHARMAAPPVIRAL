// npm run verify:android-release [-- --generated]: falla si el release Android
// admite cleartext. Revisa el manifest y los xml de android/app/src/main; con
// --generated revisa además lo que dejó `cap sync` (capacitor.config.json
// horneado y manifest de plugins), para que un sync dev nunca llegue a release.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { findGeneratedConfigIssues, findReleaseSourceIssues } from "../src/lib/env/androidRelease.ts";

const MAIN_DIR = join("android", "app", "src", "main");
const XML_DIR = join(MAIN_DIR, "res", "xml");
const GENERATED_CONFIG = join(MAIN_DIR, "assets", "capacitor.config.json");
const PLUGINS_MANIFEST = join("android", "capacitor-cordova-android-plugins", "src", "main", "AndroidManifest.xml");

const readOptional = (path: string): string | null => (existsSync(path) ? readFileSync(path, "utf8") : null);

const xmlFiles = Object.fromEntries(
  readdirSync(XML_DIR)
    .filter((name) => name.endsWith(".xml"))
    .map((name) => [name, readFileSync(join(XML_DIR, name), "utf8")])
);
const sourceIssues = findReleaseSourceIssues({
  manifest: readFileSync(join(MAIN_DIR, "AndroidManifest.xml"), "utf8"),
  xmlFiles,
});
const generatedIssues = process.argv.includes("--generated")
  ? findGeneratedConfigIssues({
      capacitorConfigJson: readOptional(GENERATED_CONFIG),
      pluginsManifest: readOptional(PLUGINS_MANIFEST),
    })
  : [];

const issues = [...sourceIssues, ...generatedIssues];
if (issues.length > 0) {
  issues.forEach((issue) => process.stderr.write(`error: ${issue}\n`));
  process.stderr.write(`verify-android-release: ${issues.length} problema(s); el release no puede admitir cleartext.\n`);
  process.exit(1);
}
process.stdout.write("verify-android-release: OK (sin cleartext en main)\n");
