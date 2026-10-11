import { parseProperties } from "./androidSigning.ts";

/**
 * Lógica pura de los scripts móviles (scripts/mobile-*.mjs): estado de los
 * dispositivos de `adb devices` y dónde están el SDK y el JDK aunque la
 * terminal no tenga ANDROID_HOME/JAVA_HOME (los scripts comprueban existencia).
 * Imports relativos con extensión .ts: también lo ejecuta Node sin bundler.
 */
export type EnvMap = Readonly<Record<string, string | undefined>>;

export interface AdbDevices {
  ready: string[];
  unauthorized: string[];
  offline: string[];
}

// Seriales solo con [A-Za-z0-9._:-]: en Windows el serial viaja en una línea de
// cmd.exe, y un dispositivo malicioso podría reportar uno con & o |.
const DEVICE_LINE = /^([A-Za-z0-9._:-]+)\s+(device|unauthorized|offline)$/;

export function parseAdbDevices(output: string): AdbDevices {
  const entries = output
    .split(/\r?\n/)
    .map((line) => DEVICE_LINE.exec(line.trim()))
    .filter((match): match is RegExpExecArray => match !== null)
    .map(([, serial, state]) => ({ serial, state }));
  const serialsIn = (state: string) => entries.filter((entry) => entry.state === state).map((entry) => entry.serial);
  return { ready: serialsIn("device"), unauthorized: serialsIn("unauthorized"), offline: serialsIn("offline") };
}

export type DevicePick = { serial: string } | { error: string };

export function pickDevice(devices: AdbDevices, preferredSerial: string | undefined): DevicePick {
  if (preferredSerial) {
    return devices.ready.includes(preferredSerial)
      ? { serial: preferredSerial }
      : { error: "ANDROID_SERIAL no corresponde a un dispositivo en estado 'device' (revisa adb devices)" };
  }
  const [first] = devices.ready;
  if (first) return { serial: first };
  if (devices.unauthorized.length > 0) {
    return { error: "El teléfono no autoriza la depuración USB: acepta el aviso en su pantalla y reintenta" };
  }
  if (devices.offline.length > 0) return { error: "El dispositivo está offline: desconecta y vuelve a conectar el USB" };
  return { error: "Conecta el teléfono por USB con la depuración USB activada (adb devices no lista ninguno)" };
}

/** local.properties escapa ':' y '\' (formato .properties de Java). */
function unescapeProperty(value: string): string {
  return value.replace(/\\(.)/g, "$1");
}

export function readSdkDir(env: EnvMap, localProperties: string | null): string | null {
  const fromEnv = env.ANDROID_HOME || env.ANDROID_SDK_ROOT;
  if (fromEnv) return fromEnv;
  const sdkDir = localProperties === null ? undefined : parseProperties(localProperties)["sdk.dir"];
  return sdkDir ? unescapeProperty(sdkDir) : null;
}

const ANDROID_STUDIO_JBR: Readonly<Record<string, readonly string[]>> = {
  win32: ["C:\\Program Files\\Android\\Android Studio\\jbr"],
  darwin: ["/Applications/Android Studio.app/Contents/jbr/Contents/Home"],
  linux: ["/opt/android-studio/jbr", "/usr/local/android-studio/jbr"],
};

export function javaHomeCandidates(env: EnvMap, platform: string): string[] {
  return [...(env.JAVA_HOME ? [env.JAVA_HOME] : []), ...(ANDROID_STUDIO_JBR[platform] ?? [])];
}
