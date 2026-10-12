import type { CapacitorConfig } from "@capacitor/cli";
import { BUNDLED_WEB_DIR, resolveCapMode, resolveCapacitorServer } from "./src/lib/env/capacitorEnv.ts";

/**
 * Modo remoto: la app usa rutas API y sesión en servidor (Supabase, ARCO,
 * citas), así que no admite `output: "export"`. El WebView carga el servidor
 * que fija CAP_ENV (ver src/lib/env/capacitorEnv.ts) y `capacitor-shell/` solo
 * es el respaldo sin conexión. Release: solo HTTPS y sin fallback; si falta
 * CAP_SERVER_URL, `cap sync` falla. En Capacitor 8 `server.cleartext` solo
 * añade usesCleartextTraffic al manifest generado de plugins; el control real
 * es el network_security_config de la variante debug.
 * Pendiente del usuario: confirmar el appId definitivo antes de publicar.
 */
const isBundled = resolveCapMode(process.env) === "bundled";
const server = isBundled ? null : resolveCapacitorServer(process.env);

/**
 * CAP_MODE=bundled: la interfaz va DENTRO del APK (export estático en
 * out-mobile/, ver scripts/build-mobile-web.mjs) y abre sin red; el origen del
 * WebView es https://localhost y solo la API (respaldo, ARCO, citas) es remota.
 * CAP_MODE=remote (por defecto): el WebView carga el servidor de arriba.
 */
const config: CapacitorConfig = {
  appId: "com.artikare.app",
  appName: "Artikare",
  webDir: isBundled ? BUNDLED_WEB_DIR : "capacitor-shell",
  ...(server
    ? { server: { url: server.url, cleartext: server.cleartext, errorPath: "index.html" } }
    : { server: { androidScheme: "https" } }),
  android: {
    allowMixedContent: server?.allowMixedContent ?? false,
  },
  plugins: {
    LocalNotifications: {
      iconColor: "#1F4E79",
    },
  },
};

export default config;
