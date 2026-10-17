// npm run release:package [-- --dest <carpeta>]: arma la carpeta de entrega
// <Escritorio>/Artikare-APK/v<VERSION>/ desde release-assets/ (APK, .sha256, notas
// y LEEME) y escribe ULTIMA-VERSION.txt. La versión sale de package.json; valida con
// aapt que el APK es esa versión y que el SHA-256 coincide. Idempotente: solo
// reemplaza los archivos con el mismo nombre, nunca borra nada más.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  buildReadme,
  findApkIssues,
  limaDate,
  parseBadging,
  releaseFileNames,
} from "../src/lib/release/releasePackage.ts";
import { androidEnv, fail, step } from "./lib/mobile.mjs";

const ASSETS_DIR = "release-assets";

function destinationRoot() {
  const flag = process.argv.indexOf("--dest");
  return flag > -1 && process.argv[flag + 1] ? process.argv[flag + 1] : join(homedir(), "Desktop", "Artikare-APK");
}

function findAapt(sdkDir) {
  const buildTools = join(sdkDir, "build-tools");
  const latest = readdirSync(buildTools).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0];
  const aapt = join(buildTools, latest ?? "", process.platform === "win32" ? "aapt.exe" : "aapt");
  if (!existsSync(aapt)) throw new Error(`No se encontró aapt en ${buildTools}`);
  return aapt;
}

function readBadging(apkPath) {
  const { ANDROID_HOME } = androidEnv();
  if (!ANDROID_HOME) throw new Error("No se encontró el SDK de Android (android/local.properties o ANDROID_HOME)");
  const result = spawnSync(findAapt(ANDROID_HOME), ["dump", "badging", apkPath], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`aapt dump badging falló: ${result.stderr.trim()}`);
  return parseBadging(result.stdout);
}

function requireAsset(name) {
  const path = join(ASSETS_DIR, name);
  if (!existsSync(path)) throw new Error(`Falta ${path}: compila con npm run mobile:bundle y cópialo (docs/MOBILE.md)`);
  return path;
}

try {
  const version = JSON.parse(readFileSync("package.json", "utf8")).version;
  const names = releaseFileNames(version);
  const apkPath = requireAsset(names.apk);
  const shaPath = requireAsset(names.sha256);
  const notesPath = requireAsset(names.notes);

  step(`Validar ${names.apk}`);
  const badging = readBadging(apkPath);
  const issues = findApkIssues(badging, version);
  if (issues.length > 0) throw new Error(`El APK no es v${version}: ${issues.join("; ")}. Recompila.`);
  const sha256 = createHash("sha256").update(readFileSync(apkPath)).digest("hex");
  const recorded = readFileSync(shaPath, "utf8").trim().split(/\s+/)[0].toLowerCase();
  if (sha256 !== recorded) throw new Error(`SHA-256 real ${sha256} ≠ ${shaPath} (${recorded}). Regenera el .sha256.`);
  process.stdout.write(`OK · ${badging.packageName} · v${badging.versionName} (build ${badging.versionCode}) · SHA-256 ${sha256}\n`);

  const root = destinationRoot();
  const folder = join(root, names.folder);
  step(`Carpeta de entrega: ${folder}`);
  mkdirSync(folder, { recursive: true });
  [apkPath, shaPath, notesPath].forEach((source) => copyFileSync(source, join(folder, source.split(/[\\/]/).pop())));
  const readme = buildReadme({ version, versionCode: badging.versionCode, minSdk: badging.minSdk, date: limaDate(new Date()), sha256 });
  writeFileSync(join(folder, names.readme), readme, "utf8");
  writeFileSync(join(root, "ULTIMA-VERSION.txt"), `${names.tag} (build ${badging.versionCode})\r\n`, "utf8");

  readdirSync(folder).forEach((name) => process.stdout.write(`  ${name}  ${statSync(join(folder, name)).size} bytes\n`));
  process.stdout.write(`  ../ULTIMA-VERSION.txt → ${names.tag} (build ${badging.versionCode})\n`);
} catch (error) {
  fail(error);
}
